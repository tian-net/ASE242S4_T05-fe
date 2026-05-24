import { useState, useEffect } from 'react';
import { fetchEventReservationsApi, fetchDeletedEventReservationsApi, cancelEventReservationApi, restoreEventReservationApi, createEventReservationApi, updateEventReservationApi } from '../api/eventReservations.api';
import { fetchCustomersApi } from '../api/customers.api';
import { fetchActiveEnabledEventsApi } from '../api/events.api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Modal } from '../components/ui/modal';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { Input } from '../components/ui/input';
import { SearchBar } from '../components/ui/search-bar';
import { FilterSelect } from '../components/ui/filter-select';
import { STATUS_COLORS, MINIMUM_HOURS } from '../lib/constants';
import { required, futureDate, maxDate, timeAfter, minDuration, positiveNumber } from '../lib/validation';

const STATUSES = ['Planificado', 'pendiente', 'Confirmado', 'Cancelado', 'En curso', 'Finalizado'];

export default function EventReservationsPage() {
    const [reservations, setReservations] = useState<any[]>([]);
    const [deleted, setDeleted] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDeleted, setShowDeleted] = useState(false);
    const [modal, setModal] = useState<{ open: boolean; edit?: any }>({ open: false });
    const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });
    const [customers, setCustomers] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [form, setForm] = useState({ customerId: '', eventId: '', eventDate: '', startTime: '', endTime: '', totalPeople: 20, notes: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const list = showDeleted ? deleted : reservations;

    const load = async () => {
        setLoading(true);
        try {
            const [a, d] = await Promise.all([fetchEventReservationsApi(), fetchDeletedEventReservationsApi()]);
            setReservations(a);
            setDeleted(d);
        } catch {
            setReservations([]);
            setDeleted([]);
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const selectedEvent = events.find(e => e.id === form.eventId);
    const minHrs = selectedEvent ? (MINIMUM_HOURS[selectedEvent.eventType] || 1) : 1;

    const validate = (field: string, value: any) => {
        const newErrors = { ...errors };
        switch (field) {
            case 'customerId': newErrors.customerId = required(value, 'Cliente') || ''; break;
            case 'eventId': newErrors.eventId = required(value, 'Evento') || ''; break;
            case 'eventDate':
                newErrors.eventDate = futureDate(value, 1) || maxDate(value, 90) || '';
                break;
            case 'startTime':
            case 'endTime':
                newErrors.startTime = '';
                newErrors.endTime = '';
                if (form.startTime && form.endTime) {
                    const t = timeAfter(form.startTime, form.endTime);
                    if (t) newErrors.endTime = t;
                    const d = minDuration(form.startTime, form.endTime, minHrs, selectedEvent?.name || 'evento');
                    if (d) newErrors.endTime = d;
                }
                break;
            case 'totalPeople':
                newErrors.totalPeople = positiveNumber(value, 'Personas') || '';
                if (value > (selectedEvent?.maxCapacity || 999)) newErrors.totalPeople = `Máximo ${selectedEvent?.maxCapacity} personas`;
                break;
        }
        setErrors(newErrors);
    };

    const openCreate = () => {
        Promise.all([fetchCustomersApi(), fetchActiveEnabledEventsApi()]).then(([c, e]) => { setCustomers(c); setEvents(e); }).catch(() => {});
        setForm({ customerId: '', eventId: '', eventDate: '', startTime: '', endTime: '', totalPeople: 20, notes: '' });
        setErrors({});
        setModal({ open: true });
    };

    const openEdit = (r: any) => {
        Promise.all([fetchCustomersApi(), fetchActiveEnabledEventsApi()]).then(([c, e]) => { setCustomers(c); setEvents(e); }).catch(() => {});
        setForm({ customerId: r.customerId, eventId: r.eventId, eventDate: r.eventDate, startTime: r.startTime?.substring(0, 5) || '', endTime: r.endTime?.substring(0, 5) || '', totalPeople: r.totalPeople, notes: r.notes || '' });
        setErrors({});
        setModal({ open: true, edit: r });
    };

    const handleSave = async () => {
        const errs: Record<string, string> = {};
        errs.customerId = required(form.customerId, 'Cliente') || '';
        errs.eventId = required(form.eventId, 'Evento') || '';
        errs.eventDate = futureDate(form.eventDate, 1) || maxDate(form.eventDate, 90) || '';
        errs.totalPeople = positiveNumber(form.totalPeople, 'Personas') || '';
        if (form.totalPeople > (selectedEvent?.maxCapacity || 999)) errs.totalPeople = `Máximo ${selectedEvent?.maxCapacity} personas`;
        if (form.startTime && form.endTime) {
            const t = timeAfter(form.startTime, form.endTime);
            if (t) errs.endTime = t;
            const d = minDuration(form.startTime, form.endTime, minHrs, selectedEvent?.name || 'evento');
            if (d) errs.endTime = d;
        }
        setErrors(errs);
        if (Object.values(errs).some(Boolean)) return;

        const [sh, sm] = form.startTime.split(':').map(Number);
        const [eh, em] = form.endTime.split(':').map(Number);
        const hours = (eh + em / 60) - (sh + sm / 60);
        const isFullDay = selectedEvent?.pricePerDay && hours >= 8;

        const payload: any = {
            customerId: form.customerId,
            eventId: form.eventId,
            eventDate: form.eventDate,
            startTime: form.startTime + ':00',
            endTime: form.endTime + ':00',
            reservationType: isFullDay ? 'dia' : 'hora',
            quantityHours: Math.ceil(hours),
            totalPeople: form.totalPeople,
            notes: form.notes,
        };
        if (modal.edit) await updateEventReservationApi(modal.edit.id, payload);
        else await createEventReservationApi(payload);
        setModal({ open: false });
        await load();
    };

    const handleCancel = async (id: string) => { await cancelEventReservationApi(id); await load(); };
    const handleRestore = async (id: string) => { await restoreEventReservationApi(id); await load(); };

    const hasErrors = Object.values(errors).some(Boolean) || !form.customerId || !form.eventId || !form.eventDate || !form.startTime || !form.endTime;

    const filtered = list.filter((r: any) => {
        const s = search.toLowerCase();
        const matchSearch = !s || r.eventName?.toLowerCase().includes(s) || r.notes?.toLowerCase().includes(s);
        const matchStatus = !statusFilter || r.status === statusFilter;
        const matchFrom = !dateFrom || r.eventDate >= dateFrom;
        const matchTo = !dateTo || r.eventDate <= dateTo;
        return matchSearch && matchStatus && matchFrom && matchTo;
    });

    if (loading) return <div className="text-center py-8 text-gray-400">Cargando...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reservas de Evento</h2>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => { setShowDeleted(!showDeleted); load(); }}>{showDeleted ? 'Activas' : 'Eliminadas'}</Button>
                    {!showDeleted && <Button onClick={openCreate}>+ Nueva</Button>}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <SearchBar value={search} onChange={setSearch} placeholder="Buscar evento o notas..." />
                <FilterSelect label="Estado" value={statusFilter} onChange={setStatusFilter} options={[{ value: '', label: 'Todos' }, ...STATUSES.map(s => ({ value: s, label: s }))]} />
                <Input label="Desde" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
                <Input label="Hasta" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((r: any) => (
                    <Card key={r.id} className="relative">
                        <div className="flex items-center justify-between mb-3">
                            <Badge className={STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-800'}>{r.status}</Badge>
                            {r.eventName && <span className="text-sm font-medium text-gray-700">{r.eventName}</span>}
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p><span className="font-medium">Fecha:</span> {r.eventDate}</p>
                            <p><span className="font-medium">Hora:</span> {r.startTime?.substring(0, 5)} - {r.endTime?.substring(0, 5)}</p>
                            <p><span className="font-medium">Personas:</span> {r.totalPeople}</p>
                            <p><span className="font-medium">Monto:</span> S/ {r.totalAmount?.toFixed(2)}</p>
                            {r.notes && <p><span className="font-medium">Notas:</span> {r.notes}</p>}
                        </div>
                        <div className="flex gap-2 mt-4 pt-3 border-t">
                            {!showDeleted ? (
                                <>
                                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Editar</Button>
                                    <Button size="sm" variant="danger" onClick={() => setConfirm({ open: true, title: 'Cancelar Reserva', message: '¿Cancelar esta reserva de evento?', onConfirm: () => handleCancel(r.id) })}>Cancelar</Button>
                                </>
                            ) : (
                                <Button size="sm" variant="secondary" onClick={() => setConfirm({ open: true, title: 'Restaurar Reserva', message: '¿Restaurar esta reserva de evento?', onConfirm: () => handleRestore(r.id) })}>Restaurar</Button>
                            )}
                        </div>
                    </Card>
                ))}
                {filtered.length === 0 && <p className="col-span-full text-center text-gray-400 py-8">Sin reservas</p>}
            </div>

            <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.edit ? 'Editar Reserva de Evento' : 'Nueva Reserva de Evento'}>
                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Cliente</label>
                        <select value={form.customerId} onChange={e => { setForm(f => ({ ...f, customerId: e.target.value })); validate('customerId', e.target.value); }} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
                            <option value="">Seleccionar cliente</option>
                            {customers.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} - {c.docNum}</option>)}
                        </select>
                        {errors.customerId && <span className="text-xs text-red-600">{errors.customerId}</span>}
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Evento</label>
                        <select value={form.eventId} onChange={e => { setForm(f => ({ ...f, eventId: e.target.value })); validate('eventId', e.target.value); }} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
                            <option value="">Seleccionar evento</option>
                            {events.map((e: any) => <option key={e.id} value={e.id}>{e.name} (Cap: {e.maxCapacity})</option>)}
                        </select>
                        {errors.eventId && <span className="text-xs text-red-600">{errors.eventId}</span>}
                    </div>
                    <Input label="Fecha" type="date" value={form.eventDate} onChange={e => { setForm(f => ({ ...f, eventDate: e.target.value })); validate('eventDate', e.target.value); }} error={errors.eventDate} />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Hora inicio" type="time" value={form.startTime} onChange={e => { setForm(f => ({ ...f, startTime: e.target.value })); validate('startTime', e.target.value); }} />
                        <Input label="Hora fin" type="time" value={form.endTime} onChange={e => { setForm(f => ({ ...f, endTime: e.target.value })); validate('endTime', e.target.value); }} error={errors.endTime} />
                    </div>
                    <Input label="Personas" type="number" value={String(form.totalPeople)} onChange={e => { setForm(f => ({ ...f, totalPeople: Number(e.target.value) })); validate('totalPeople', Number(e.target.value)); }} error={errors.totalPeople} min={1} max={selectedEvent?.maxCapacity || 999} />
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Notas</label>
                        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setModal({ open: false })}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={hasErrors}>Guardar</Button>
                    </div>
                </div>
            </Modal>
            <ConfirmDialog open={confirm.open} title={confirm.title} message={confirm.message} onConfirm={() => { confirm.onConfirm(); setConfirm(c => ({ ...c, open: false })); }} onCancel={() => setConfirm(c => ({ ...c, open: false }))} />
        </div>
    );
}
