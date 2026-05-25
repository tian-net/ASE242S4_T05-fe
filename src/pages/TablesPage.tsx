import { useState } from 'react';
import { useTables } from '../hooks/useTable';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { Badge } from '../components/ui/Badge';
import { DataTable } from '../components/shared/DataTable';
import { SearchBar } from '../components/ui/search-bar';
import { FilterSelect } from '../components/ui/filter-select';
import { positiveNumber, isValidJson } from '../lib/validation';

export default function TablesPage() {
    const { tables, deleted, loading, create, update, remove, restore, reload } = useTables();
    const [modal, setModal] = useState<{ open: boolean; edit?: any }>({ open: false });
    const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });
    const [form, setForm] = useState({ tableNum: 0, capacity: 4, location: '', description: '', status: 'AVAILABLE', isReservable: true });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showDeleted, setShowDeleted] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [reservableFilter, setReservableFilter] = useState('');
    const list = showDeleted ? deleted : tables;

    const validate = (field: string, value: any) => {
        const newErrors = { ...errors };
        switch (field) {
            case 'tableNum': newErrors.tableNum = positiveNumber(value, 'N° Mesa') || ''; break;
            case 'capacity': newErrors.capacity = positiveNumber(value, 'Capacidad') || ''; break;
            case 'location': newErrors.location = isValidJson(value) || ''; break;
        }
        setErrors(newErrors);
    };

    const openCreate = () => {
        setForm({ tableNum: 0, capacity: 4, location: '', description: '', status: 'AVAILABLE', isReservable: true });
        setErrors({});
        setModal({ open: true });
    };

    const openEdit = (t: any) => {
        setForm({ tableNum: t.tableNum, capacity: t.capacity, location: t.location || '', description: t.description || '', status: t.status || 'AVAILABLE', isReservable: t.isReservable ?? true });
        setErrors({});
        setModal({ open: true, edit: t });
    };

    const handleSave = async () => {
        const errs: Record<string, string> = {};
        errs.tableNum = positiveNumber(form.tableNum, 'N° Mesa') || '';
        errs.capacity = positiveNumber(form.capacity, 'Capacidad') || '';
        errs.location = isValidJson(form.location) || '';
        setErrors(errs);
        if (Object.values(errs).some(Boolean)) return;
        if (modal.edit) await update(modal.edit.id, form);
        else await create(form);
        setModal({ open: false });
    };

    const hasErrors = Object.values(errors).some(Boolean) || form.tableNum <= 0 || form.capacity <= 0;

    const filtered = list.filter((t: any) => {
        const s = search.toLowerCase();
        const matchSearch = !s || `mesa ${t.tableNum}`.includes(s) || String(t.tableNum).includes(s);
        const matchStatus = !statusFilter || t.status === statusFilter;
        const matchReservable = !reservableFilter || (reservableFilter === 'si' ? t.isReservable : !t.isReservable);
        return matchSearch && matchStatus && matchReservable;
    });

    if (loading) return <div className="text-center py-8 text-gray-400">Cargando...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Mesas</h2>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => { setShowDeleted(!showDeleted); reload(); }}>{showDeleted ? 'Activas' : 'Eliminadas'}</Button>
                    {!showDeleted && <Button onClick={openCreate}>+ Nueva</Button>}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <SearchBar value={search} onChange={setSearch} placeholder="Buscar n° mesa..." />
                <FilterSelect label="Estado" value={statusFilter} onChange={setStatusFilter} options={[{ value: '', label: 'Todos' }, { value: 'AVAILABLE', label: 'Disponible' }, { value: 'Reservada', label: 'Reservada' }]} />
                <FilterSelect label="Reservable" value={reservableFilter} onChange={setReservableFilter} options={[{ value: '', label: 'Todos' }, { value: 'si', label: 'Sí' }, { value: 'no', label: 'No' }]} />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <DataTable
                    headers={['N° Mesa', 'Capacidad', 'Ubicación', 'Estado', 'Reservable', 'Acciones']}
                    rows={filtered.map((t: any) => [
                        `Mesa ${t.tableNum}`,
                        `${t.capacity} pers.`,
                        t.location || '-',
                        <Badge className={t.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{t.status}</Badge>,
                        <Badge className={t.isReservable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{t.isReservable ? 'Sí' : 'No'}</Badge>,
                        <div className="flex gap-2">
                            {!showDeleted ? (
                                <>
                                    <Button size="sm" variant="ghost" onClick={() => openEdit(t)}>Editar</Button>
                                    <Button size="sm" variant="danger" onClick={() => setConfirm({ open: true, title: 'Eliminar Mesa', message: `¿Eliminar Mesa ${t.tableNum}?`, onConfirm: () => remove(t.id) })}>Eliminar</Button>
                                </>
                            ) : (
                                <Button size="sm" variant="secondary" onClick={() => setConfirm({ open: true, title: 'Restaurar Mesa', message: `¿Restaurar Mesa ${t.tableNum}?`, onConfirm: () => restore(t.id) })}>Restaurar</Button>
                            )}
                        </div>,
                    ])}
                />
            </div>

            <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.edit ? 'Editar Mesa' : 'Nueva Mesa'}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="N° Mesa" type="number" value={String(form.tableNum)} onChange={e => { setForm(f => ({ ...f, tableNum: Number(e.target.value) })); validate('tableNum', Number(e.target.value)); }} error={errors.tableNum} />
                        <Input label="Capacidad" type="number" value={String(form.capacity)} onChange={e => { setForm(f => ({ ...f, capacity: Number(e.target.value) })); validate('capacity', Number(e.target.value)); }} error={errors.capacity} />
                    </div>
                    <Input label="Ubicación (JSON)" value={form.location} onChange={e => { setForm(f => ({ ...f, location: e.target.value })); validate('location', e.target.value); }} error={errors.location} placeholder='{"piso":1}' />
                    <Input label="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Estado</label>
                            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
                                <option value="AVAILABLE">Disponible</option>
                                <option value="Reservada">Reservada</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input type="checkbox" checked={form.isReservable} onChange={e => setForm(f => ({ ...f, isReservable: e.target.checked }))} className="rounded" />
                            <label className="text-sm text-gray-700">Reservable</label>
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
