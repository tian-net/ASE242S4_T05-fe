import { useState, useEffect } from 'react';
import { fetchReservationsApi, cancelReservationApi, createReservationApi, updateReservationApi } from '../api/reservations.api';
import { fetchCustomersApi } from '../api/customers.api';
import { fetchTablesApi } from '../api/tables.api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { Input } from '../components/ui/Input';
import { SearchBar } from '../components/ui/search-bar';
import { FilterSelect } from '../components/ui/filter-select';
import { STATUS_COLORS } from '../lib/constants';
import { required, futureDate, positiveNumber } from '../lib/validation';

export default function ReservationsPage() {
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<{ open: boolean; edit?: any }>({ open: false });
    const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });
    const [customers, setCustomers] = useState<any[]>([]);
    const [tables, setTables] = useState<any[]>([]);
    const [form, setForm] = useState({ customerId: '', resDate: '', resTime: '', numPeople: 4, selectedTables: [] as string[] });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchReservationsApi();
            setReservations(data);
        } catch {
            setReservations([]);
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const validate = (field: string, value: any) => {
        const newErrors = { ...errors };
        switch (field) {
            case 'customerId': newErrors.customerId = required(value, 'Cliente') || ''; break;
            case 'resDate': newErrors.resDate = futureDate(value, 1) || ''; break;
            case 'resTime': newErrors.resTime = required(value, 'Hora') || ''; break;
            case 'numPeople': newErrors.numPeople = positiveNumber(value, 'Personas') || ''; break;
            case 'selectedTables': newErrors.selectedTables = value.length === 0 ? 'Selecciona al menos una mesa' : ''; break;
        }
        setErrors(newErrors);
    };

    const openCreate = () => {
        Promise.all([fetchCustomersApi(), fetchTablesApi()]).then(([c, t]) => { setCustomers(c); setTables(t.filter((tbl: any) => tbl.isReservable !== false)); }).catch(() => {});
        setForm({ customerId: '', resDate: '', resTime: '', numPeople: 4, selectedTables: [] });
        setErrors({});
        setModal({ open: true });
    };

    const openEdit = (r: any) => {
        Promise.all([fetchCustomersApi(), fetchTablesApi()]).then(([c, t]) => { setCustomers(c); setTables(t.filter((tbl: any) => tbl.isReservable !== false)); }).catch(() => {});
        setForm({
            customerId: r.customerId,
            resDate: r.resDate,
            resTime: r.resTime?.substring(0, 5) || '',
            numPeople: r.numPeople,
            selectedTables: r.details?.map((d: any) => d.tableId) || [],
        });
        setErrors({});
        setModal({ open: true, edit: r });
    };

    const toggleTable = (tableId: string) => {
        const table = tables.find(t => t.id === tableId);
        if (table && table.status !== 'AVAILABLE') return;
        const newSelected = form.selectedTables.includes(tableId)
            ? form.selectedTables.filter(id => id !== tableId)
            : [...form.selectedTables, tableId];
        setForm(f => ({ ...f, selectedTables: newSelected }));
        validate('selectedTables', newSelected);
    };

    const handleSave = async () => {
        const errs: Record<string, string> = {};
        errs.customerId = required(form.customerId, 'Cliente') || '';
        errs.resDate = futureDate(form.resDate, 1) || '';
        errs.resTime = required(form.resTime, 'Hora') || '';
        errs.numPeople = positiveNumber(form.numPeople, 'Personas') || '';
        errs.selectedTables = form.selectedTables.length === 0 ? 'Selecciona al menos una mesa' : '';
        setErrors(errs);
        if (Object.values(errs).some(Boolean)) return;

        const payload: any = {
            customerId: form.customerId,
            resDate: form.resDate,
            resTime: form.resTime,
            numPeople: form.numPeople,
            details: form.selectedTables.map(id => ({ tableId: id, notes: '' })),
        };
        if (modal.edit) {
            const existing = reservations.find((r: any) => r.id === modal.edit.id);
            if (existing?.details) {
                payload.details = form.selectedTables.map(id => {
                    const existingDetail = existing.details.find((d: any) => d.tableId === id);
                    return { tableId: id, notes: existingDetail?.notes || '' };
                });
            }
            await updateReservationApi(modal.edit.id, payload);
        }
        else await createReservationApi(payload);
        setModal({ open: false });
        await load();
    };

    const handleCancel = async (id: string) => { await cancelReservationApi(id); await load(); };

    const hasErrors = Object.values(errors).some(Boolean) || !form.customerId || !form.resDate || !form.resTime || form.selectedTables.length === 0;

    const filtered = reservations.filter((r: any) => {
        const s = search.toLowerCase();
        const matchSearch = !s || r.resDate?.includes(s);
        const matchStatus = !statusFilter || r.status === statusFilter || (!r.status && statusFilter === 'Pendiente');
        return matchSearch && matchStatus;
    });

    if (loading) return <div className="text-center py-8 text-gray-400">Cargando...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Reservas de Mesa</h2>
                <Button onClick={openCreate}>+ Nueva</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <SearchBar value={search} onChange={setSearch} placeholder="Buscar fecha..." />
                <FilterSelect label="Estado" value={statusFilter} onChange={setStatusFilter} options={[{ value: '', label: 'Todos' }, { value: 'Pendiente', label: 'Pendiente' }, { value: 'Confirmada', label: 'Confirmada' }, { value: 'Cancelada', label: 'Cancelada' }, { value: 'Atendida', label: 'Atendida' }]} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((r: any) => (
                    <Card key={r.id} className="relative">
                        <div className="flex items-center justify-between mb-3">
                            <Badge className={STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-800'}>{r.status || 'Pendiente'}</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p><span className="font-medium">Fecha:</span> {r.resDate}</p>
                            <p><span className="font-medium">Hora:</span> {r.resTime?.substring(0, 5)}</p>
                            <p><span className="font-medium">Personas:</span> {r.numPeople}</p>
                            <p><span className="font-medium">Monto:</span> S/ {r.totalAmt?.toFixed(2) || '0.00'}</p>
                            {r.details && r.details.length > 0 && <p><span className="font-medium">Mesas:</span> {r.details.map((d: any) => d.tableId).join(', ')}</p>}
                        </div>
                        <div className="flex gap-2 mt-4 pt-3 border-t">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Editar</Button>
                            <Button size="sm" variant="danger" onClick={() => setConfirm({ open: true, title: 'Cancelar Reserva', message: '¿Cancelar esta reserva de mesa?', onConfirm: () => handleCancel(r.id) })}>Cancelar</Button>
                        </div>
                    </Card>
                ))}
                {filtered.length === 0 && <p className="col-span-full text-center text-gray-400 py-8">Sin reservas</p>}
            </div>

            <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.edit ? 'Editar Reserva de Mesa' : 'Nueva Reserva de Mesa'}>
                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Cliente</label>
                        <select value={form.customerId} onChange={e => { setForm(f => ({ ...f, customerId: e.target.value })); validate('customerId', e.target.value); }} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
                            <option value="">Seleccionar cliente</option>
                            {customers.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} - {c.docNum}</option>)}
                        </select>
                        {errors.customerId && <span className="text-xs text-red-600">{errors.customerId}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Fecha" type="date" value={form.resDate} onChange={e => { setForm(f => ({ ...f, resDate: e.target.value })); validate('resDate', e.target.value); }} error={errors.resDate} />
                        <Input label="Hora" type="time" value={form.resTime} onChange={e => { setForm(f => ({ ...f, resTime: e.target.value })); validate('resTime', e.target.value); }} error={errors.resTime} />
                    </div>
                    <Input label="N° Personas" type="number" value={String(form.numPeople)} onChange={e => { setForm(f => ({ ...f, numPeople: Number(e.target.value) })); validate('numPeople', Number(e.target.value)); }} error={errors.numPeople} min={1} />
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Mesas disponibles</label>
                        {errors.selectedTables && <span className="text-xs text-red-600">{errors.selectedTables}</span>}
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                            {tables.map((t: any) => {
                                const isAvail = t.status === 'AVAILABLE';
                                const selected = form.selectedTables.includes(t.id);
                                return (
                                    <label key={t.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${selected ? 'bg-blue-50 border border-blue-300' : isAvail ? 'bg-gray-50 border border-gray-200' : 'bg-gray-100 border border-gray-200 opacity-60'}`}>
                                        <input type="checkbox" checked={selected} disabled={!isAvail} onChange={() => toggleTable(t.id)} className="rounded" />
                                        <span className="flex-1">Mesa {t.tableNum} ({t.capacity} pers.)</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${isAvail ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isAvail ? 'Libre' : 'Ocupada'}</span>
                                    </label>
                                );
                            })}
                            {tables.length === 0 && <p className="text-gray-400 text-sm col-span-2">No hay mesas disponibles</p>}
                        </div>
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
