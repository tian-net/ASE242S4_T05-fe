import { useState } from 'react';
import { useEvents } from '../hooks/useEvent';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Badge } from '../components/ui/Badge';
import { DataTable } from '../components/shared/DataTable';
import { SearchBar } from '../components/ui/SearchBar';
import { FilterSelect } from '../components/ui/FilterSelect';
import { required, positiveNumber, nonNegative } from '../lib/validation';

const EVENT_TYPES = ['FULL_DAY', 'ALQUILER_POR_HORA', 'CUMPLEANOS', 'BODA', 'MATRIMONIO', 'BABY_SHOWER', 'DESPEDIDA', 'GRADO', 'GARANTIA', 'CONFERENCIA'];

export default function EventsPage() {
    const { events, deleted, loading, create, update, remove, restore, reload } = useEvents();
    const [modal, setModal] = useState<{ open: boolean; edit?: any }>({ open: false });
    const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });
    const [form, setForm] = useState({ name: '', eventType: 'FULL_DAY', description: '', maxCapacity: 50, pricePerHour: 0, pricePerDay: 0, isActive: true });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showDeleted, setShowDeleted] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const list = showDeleted ? deleted : events;

    const validate = (field: string, value: any) => {
        const newErrors = { ...errors };
        switch (field) {
            case 'name': newErrors.name = required(value, 'Nombre') || ''; break;
            case 'maxCapacity': newErrors.maxCapacity = positiveNumber(value, 'Capacidad') || ''; break;
            case 'pricePerHour': newErrors.pricePerHour = nonNegative(value, 'Precio por hora') || ''; break;
            case 'pricePerDay': newErrors.pricePerDay = nonNegative(value, 'Precio por día') || ''; break;
        }
        setErrors(newErrors);
    };

    const openCreate = () => {
        setForm({ name: '', eventType: 'FULL_DAY', description: '', maxCapacity: 50, pricePerHour: 0, pricePerDay: 0, isActive: true });
        setErrors({});
        setModal({ open: true });
    };

    const openEdit = (e: any) => {
        setForm({ name: e.name, eventType: e.eventType, description: e.description || '', maxCapacity: e.maxCapacity, pricePerHour: e.pricePerHour, pricePerDay: e.pricePerDay || 0, isActive: e.isActive });
        setErrors({});
        setModal({ open: true, edit: e });
    };

    const handleSave = async () => {
        const errs: Record<string, string> = {};
        errs.name = required(form.name, 'Nombre') || '';
        errs.maxCapacity = positiveNumber(form.maxCapacity, 'Capacidad') || '';
        errs.pricePerHour = nonNegative(form.pricePerHour, 'Precio por hora') || '';
        errs.pricePerDay = nonNegative(form.pricePerDay, 'Precio por día') || '';
        setErrors(errs);
        if (Object.values(errs).some(Boolean)) return;
        if (modal.edit) await update(modal.edit.id, form);
        else await create(form);
        setModal({ open: false });
    };

    const hasErrors = Object.values(errors).some(Boolean) || !form.name;

    const filtered = list.filter((e: any) => {
        const s = search.toLowerCase();
        const matchSearch = !s || e.name?.toLowerCase().includes(s);
        const matchType = !typeFilter || e.eventType === typeFilter;
        const matchStatus = !statusFilter || (statusFilter === 'activo' ? e.isActive : !e.isActive);
        return matchSearch && matchType && matchStatus;
    });

    if (loading) return <div className="text-center py-8 text-gray-400">Cargando...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Eventos</h2>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => { setShowDeleted(!showDeleted); reload(); }}>{showDeleted ? 'Activos' : 'Eliminados'}</Button>
                    {!showDeleted && <Button onClick={openCreate}>+ Nuevo</Button>}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <SearchBar value={search} onChange={setSearch} placeholder="Buscar nombre..." />
                <FilterSelect label="Tipo" value={typeFilter} onChange={setTypeFilter} options={[{ value: '', label: 'Todos' }, ...EVENT_TYPES.map(t => ({ value: t, label: t.replace(/_/g, ' ') }))]} />
                <FilterSelect label="Estado" value={statusFilter} onChange={setStatusFilter} options={[{ value: '', label: 'Todos' }, { value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }]} />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <DataTable
                    headers={['Nombre', 'Tipo', 'Capacidad', 'Precio/hora', 'Precio/día', 'Estado', 'Acciones']}
                    rows={filtered.map((e: any) => [
                        e.name,
                        e.eventType,
                        e.maxCapacity,
                        `S/ ${e.pricePerHour}`,
                        e.pricePerDay ? `S/ ${e.pricePerDay}` : '-',
                        <Badge className={e.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{e.isActive ? 'Activo' : 'Inactivo'}</Badge>,
                        <div className="flex gap-2">
                            {!showDeleted ? (
                                <>
                                    <Button size="sm" variant="ghost" onClick={() => openEdit(e)}>Editar</Button>
                                    <Button size="sm" variant="danger" onClick={() => setConfirm({ open: true, title: 'Eliminar Evento', message: `¿Eliminar ${e.name}?`, onConfirm: () => remove(e.id) })}>Eliminar</Button>
                                </>
                            ) : (
                                <Button size="sm" variant="secondary" onClick={() => setConfirm({ open: true, title: 'Restaurar Evento', message: `¿Restaurar ${e.name}?`, onConfirm: () => restore(e.id) })}>Restaurar</Button>
                            )}
                        </div>,
                    ])}
                />
            </div>

            <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.edit ? 'Editar Evento' : 'Nuevo Evento'}>
                <div className="space-y-4">
                    <Input label="Nombre" value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); validate('name', e.target.value); }} error={errors.name} />
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Tipo de evento</label>
                        <select value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
                            {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                        </select>
                    </div>
                    <Input label="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    <div className="grid grid-cols-3 gap-3">
                        <Input label="Capacidad máx." type="number" value={String(form.maxCapacity)} onChange={e => { setForm(f => ({ ...f, maxCapacity: Number(e.target.value) })); validate('maxCapacity', Number(e.target.value)); }} error={errors.maxCapacity} />
                        <Input label="Precio por hora" type="number" value={String(form.pricePerHour)} onChange={e => { setForm(f => ({ ...f, pricePerHour: Number(e.target.value) })); validate('pricePerHour', Number(e.target.value)); }} error={errors.pricePerHour} />
                        <Input label="Precio por día" type="number" value={String(form.pricePerDay)} onChange={e => { setForm(f => ({ ...f, pricePerDay: Number(e.target.value) })); validate('pricePerDay', Number(e.target.value)); }} error={errors.pricePerDay} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                        <label className="text-sm text-gray-700">Activo</label>
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
