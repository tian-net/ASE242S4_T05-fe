import { useState, useEffect } from 'react';
import { checkEventAvailabilityApi, fetchEventReservationsApi, fetchDeletedEventReservationsApi, cancelEventReservationApi, restoreEventReservationApi, createEventReservationApi, updateEventReservationApi } from '../api/eventReservations.api';
import { fetchCustomersApi } from '../api/customers.api';
import { fetchActiveEnabledEventsApi } from '../api/events.api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { Input } from '../components/ui/Input';
import { SearchBar } from '../components/ui/search-bar';
import { FilterSelect } from '../components/ui/filter-select';
import { STATUS_COLORS } from '../lib/constants';
import { required } from '../lib/validation';

const STATUSES = ['Planificado', 'pendiente', 'Confirmado', 'Cancelado', 'En curso', 'Finalizado'];

interface DetailForm {
    id: number;
    eventId: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    reservationType: string;
    quantityHours: number;
    totalPeople: number;
    notes: string;
    conflictMsg: string;
}

export default function EventReservationsPage() {
    const [reservations, setReservations] = useState<any[]>([]);
    const [deleted, setDeleted] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDeleted, setShowDeleted] = useState(false);
    const [modal, setModal] = useState<{ open: boolean; edit?: any }>({ open: false });
    const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });
    const [customers, setCustomers] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [form, setForm] = useState({ customerId: '', status: '' });
    const [details, setDetails] = useState<DetailForm[]>([]);
    const [nextDetailId, setNextDetailId] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [serverError, setServerError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
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

    const addDetail = () => {
        setDetails([...details, { id: nextDetailId, eventId: '', eventDate: '', startTime: '', endTime: '', reservationType: 'hora', quantityHours: 0, totalPeople: 20, notes: '', conflictMsg: '' }]);
        setNextDetailId(nextDetailId + 1);
    };

    const removeDetail = (id: number) => setDetails(details.filter(d => d.id !== id));

    let conflictTimer: ReturnType<typeof setTimeout>;
    const checkConflict = async (d: DetailForm) => {
        if (!d.eventDate || !d.startTime || !d.endTime) return;
        try {
            const res = await checkEventAvailabilityApi({
                eventDate: d.eventDate,
                startTime: d.startTime + ':00',
                endTime: d.endTime + ':00',
                reservationType: d.reservationType,
                excludeId: modal.edit?.id,
            });
            setDetails(prev => prev.map(pd => pd.id === d.id ? { ...pd, conflictMsg: res.available ? '' : (res.conflicts[0]?.message || 'Conflicto de horario') } : pd));
        } catch {
            setDetails(prev => prev.map(pd => pd.id === d.id ? { ...pd, conflictMsg: '' } : pd));
        }
    };

    const updateDetail = (id: number, field: string, value: any) => {
        setDetails(details.map(d => {
            if (d.id !== id) return d;
            const updated = { ...d, [field]: value };
            if (field === 'startTime' || field === 'endTime') {
                if (updated.startTime && updated.endTime) {
                    const [sh, sm] = updated.startTime.split(':').map(Number);
                    const [eh, em] = updated.endTime.split(':').map(Number);
                    const hours = (eh + em / 60) - (sh + sm / 60);
                    updated.quantityHours = Math.ceil(hours);
                    if (hours >= 8) updated.reservationType = 'dia';
                    else updated.reservationType = 'hora';
                }
            }
            if (field === 'eventDate' || field === 'startTime' || field === 'endTime') {
                clearTimeout(conflictTimer);
                conflictTimer = setTimeout(() => checkConflict(updated), 500);
            }
            return updated;
        }));
    };

    const validate = (field: string, value: any) => {
        const newErrors = { ...errors };
        switch (field) {
            case 'customerId': newErrors.customerId = required(value, 'Cliente') || ''; break;
        }
        setErrors(newErrors);
    };

    const openCreate = () => {
        Promise.all([fetchCustomersApi(), fetchActiveEnabledEventsApi()]).then(([c, e]) => { setCustomers(c); setEvents(e); }).catch(() => {});
        setForm({ customerId: '', status: '' });
        setDetails([]);
        setErrors({});
        setServerError('');
        setModal({ open: true });
    };

    const openEdit = (r: any) => {
        Promise.all([fetchCustomersApi(), fetchActiveEnabledEventsApi()]).then(([c, e]) => { setCustomers(c); setEvents(e); }).catch(() => {});
        setForm({ customerId: r.customerId, status: r.status || '' });
        setDetails((r.details || []).map((d: any, i: number) => ({
            id: i,
            eventId: d.eventId,
            eventDate: d.eventDate,
            startTime: d.startTime?.substring(0, 5) || '',
            endTime: d.endTime?.substring(0, 5) || '',
            reservationType: d.reservationType || 'hora',
            quantityHours: d.quantityHours || 0,
            totalPeople: d.totalPeople || 1,
            notes: d.notes || '',
            conflictMsg: '',
        })));
        setNextDetailId((r.details || []).length);
        setErrors({});
        setServerError('');
        setModal({ open: true, edit: r });
    };

    const handleSave = async () => {
        const errs: Record<string, string> = {};
        errs.customerId = required(form.customerId, 'Cliente') || '';
        setErrors(errs);
        if (Object.values(errs).some(Boolean)) return;
        if (details.length === 0) { setServerError('Debe agregar al menos un evento'); return; }
        if (details.some(d => d.conflictMsg)) { setServerError('Resuelva los conflictos de horario antes de guardar'); return; }

        const payload: any = {
            customerId: form.customerId,
            details: details.map(d => ({
                eventId: d.eventId,
                eventDate: d.eventDate,
                startTime: d.startTime ? d.startTime + ':00' : null,
                endTime: d.endTime ? d.endTime + ':00' : null,
                reservationType: d.reservationType,
                quantityHours: d.quantityHours,
                totalPeople: d.totalPeople,
                notes: d.notes,
            })),
        };
        if (modal.edit) {
            payload.status = form.status;
        }
        try {
            if (modal.edit) await updateEventReservationApi(modal.edit.id, payload);
            else await createEventReservationApi(payload);
            setModal({ open: false });
            await load();
        } catch (err: any) {
            setServerError(err?.response?.data?.message || 'Error al guardar la reserva');
        }
    };

    const handleCancel = async (id: string) => { await cancelEventReservationApi(id); await load(); };
    const handleRestore = async (id: string) => { await restoreEventReservationApi(id); await load(); };

    const hasErrors = Object.values(errors).some(Boolean) || !form.customerId || details.length === 0 || details.some(d => !d.eventId || !d.eventDate || d.conflictMsg);

    const filtered = list.filter((r: any) => {
        const s = search.toLowerCase();
        const eventNames = (r.details || []).map((d: any) => (d.eventName || '').toLowerCase()).join(' ');
        const matchSearch = !s || eventNames.includes(s);
        const matchStatus = !statusFilter || r.status === statusFilter;
        return matchSearch && matchStatus;
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
                <SearchBar value={search} onChange={setSearch} placeholder="Buscar evento..." />
                <FilterSelect label="Estado" value={statusFilter} onChange={setStatusFilter} options={[{ value: '', label: 'Todos' }, ...STATUSES.map(s => ({ value: s, label: s }))]} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((r: any) => (
                    <Card key={r.id} className="relative">
                        <div className="flex items-center justify-between mb-3">
                            <Badge className={STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-800'}>{r.status}</Badge>
                            <span className="text-sm font-medium text-gray-700">{(r.details || []).length} evento(s)</span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                            {(r.details || []).map((d: any, i: number) => (
                                <div key={i} className={i > 0 ? 'pt-2 border-t border-gray-100 mt-2' : ''}>
                                    <p><span className="font-medium">Evento:</span> {d.eventName}</p>
                                    <p><span className="font-medium">Fecha:</span> {d.eventDate} | <span className="font-medium">Hora:</span> {d.startTime?.substring(0, 5)} - {d.endTime?.substring(0, 5)}</p>
                                    <p><span className="font-medium">Invitados:</span> {d.totalPeople}</p>
                                    {d.notes && <p><span className="font-medium">Notas:</span> {d.notes}</p>}
                                </div>
                            ))}
                            <p><span className="font-medium">Monto:</span> S/ {r.totalAmount?.toFixed(2)}</p>
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
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    {serverError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{serverError}</div>}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Cliente</label>
                        <select value={form.customerId} onChange={e => { setForm(f => ({ ...f, customerId: e.target.value })); validate('customerId', e.target.value); }} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
                            <option value="">Seleccionar cliente</option>
                            {customers.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} - {c.docNum}</option>)}
                        </select>
                        {errors.customerId && <span className="text-xs text-red-600">{errors.customerId}</span>}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Eventos</label>
                            <Button size="sm" variant="ghost" onClick={addDetail}>+ Agregar evento</Button>
                        </div>
                        {details.map((d, idx) => (
                            <div key={d.id} className="border rounded-lg p-3 bg-gray-50 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500">Evento {idx + 1}</span>
                                    {details.length > 1 && <button onClick={() => removeDetail(d.id)} className="text-red-500 text-xs">✕</button>}
                                </div>
                                <select value={d.eventId} onChange={e => updateDetail(d.id, 'eventId', e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
                                    <option value="">Seleccionar evento</option>
                                    {events.map((e: any) => <option key={e.id} value={e.id}>{e.name} (Cap: {e.maxCapacity})</option>)}
                                </select>
                                <Input label="Fecha" type="date" value={d.eventDate} onChange={e => updateDetail(d.id, 'eventDate', e.target.value)} />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input label="Inicio" type="time" value={d.startTime} onChange={e => updateDetail(d.id, 'startTime', e.target.value)} />
                                    <Input label="Fin" type="time" value={d.endTime} onChange={e => updateDetail(d.id, 'endTime', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input label="Invitados" type="number" value={String(d.totalPeople)} onChange={e => updateDetail(d.id, 'totalPeople', Number(e.target.value))} min={1} />
                                    <Input label="Notas" value={d.notes} onChange={e => updateDetail(d.id, 'notes', e.target.value)} />
                                </div>
                                {d.startTime && d.endTime && (
                                    <p className="text-xs text-gray-500">{d.quantityHours}h · {d.reservationType === 'dia' ? 'Día completo' : 'Por hora'}</p>
                                )}
                                {d.conflictMsg && <p className="text-xs text-yellow-700 bg-yellow-50 p-1 rounded">⚠️ {d.conflictMsg}</p>}
                            </div>
                        ))}
                    </div>

                    {modal.edit && (
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Estado</label>
                            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
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
