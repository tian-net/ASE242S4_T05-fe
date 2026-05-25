import { useState } from 'react';
import { useUsers } from '../hooks/useUser';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { Badge } from '../components/ui/Badge';
import { DataTable } from '../components/shared/DataTable';
import { SearchBar } from '../components/ui/search-bar';
import { FilterSelect } from '../components/ui/filter-select';
import { required, email, minLength, lettersOnly } from '../lib/validation';

export default function UsersPage() {
    const { users, deleted, loading, create, update, remove, restore, reload } = useUsers();
    const [modal, setModal] = useState<{ open: boolean; edit?: any }>({ open: false });
    const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });
    const [form, setForm] = useState<{ fullName: string; email: string; password: string; role: 'admin' | 'cliente'; isActive: boolean }>({ fullName: '', email: '', password: '', role: 'admin', isActive: true });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showDeleted, setShowDeleted] = useState(false);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const list = showDeleted ? deleted : users;

    const validate = (field: string, value: any) => {
        const newErrors = { ...errors };
        switch (field) {
            case 'fullName': newErrors.fullName = required(value, 'Nombre') || minLength(3)(value, 'Nombre') || lettersOnly(value, 'Nombre') || ''; break;
            case 'email': newErrors.email = email(value) || ''; break;
            case 'password':
                if (!modal.edit || value) newErrors.password = minLength(6)(value, 'Contraseña') || '';
                else newErrors.password = '';
                break;
        }
        setErrors(newErrors);
    };

    const openCreate = () => {
        setForm({ fullName: '', email: '', password: '', role: 'admin', isActive: true });
        setErrors({});
        setModal({ open: true });
    };

    const openEdit = (u: any) => {
        setForm({ fullName: u.fullName, email: u.email, password: '', role: u.role, isActive: u.isActive });
        setErrors({});
        setModal({ open: true, edit: u });
    };

    const handleSave = async () => {
        const errs: Record<string, string> = {};
        errs.fullName = required(form.fullName, 'Nombre') || minLength(3)(form.fullName, 'Nombre') || lettersOnly(form.fullName, 'Nombre') || '';
        errs.email = email(form.email) || '';
        if (!modal.edit || form.password) errs.password = minLength(6)(form.password, 'Contraseña') || '';
        setErrors(errs);
        if (Object.values(errs).some(Boolean)) return;
        if (modal.edit) await update(modal.edit.id, form);
        else await create(form);
        setModal({ open: false });
    };

    const hasErrors = Object.values(errors).some(Boolean) || !form.fullName || !form.email || (!modal.edit && !form.password);

    const filtered = list.filter((u: any) => {
        const s = search.toLowerCase();
        const matchSearch = !s || u.fullName?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
        const matchRole = !roleFilter || u.role === roleFilter;
        const matchStatus = !statusFilter || (statusFilter === 'activo' ? u.isActive : !u.isActive);
        return matchSearch && matchRole && matchStatus;
    });

    if (loading) return <div className="text-center py-8 text-gray-400">Cargando...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => { setShowDeleted(!showDeleted); reload(); }}>{showDeleted ? 'Activos' : 'Eliminados'}</Button>
                    {!showDeleted && <Button onClick={openCreate}>+ Nuevo</Button>}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <SearchBar value={search} onChange={setSearch} placeholder="Buscar nombre o email..." />
                <FilterSelect label="Rol" value={roleFilter} onChange={setRoleFilter} options={[{ value: '', label: 'Todos' }, { value: 'admin', label: 'Admin' }, { value: 'cliente', label: 'Cliente' }]} />
                <FilterSelect label="Estado" value={statusFilter} onChange={setStatusFilter} options={[{ value: '', label: 'Todos' }, { value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }]} />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <DataTable
                    headers={['Nombre', 'Email', 'Rol', 'Estado', 'Acciones']}
                    rows={filtered.map((u: any) => [
                        u.fullName,
                        u.email,
                        <Badge className={u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>{u.role}</Badge>,
                        <Badge className={u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{u.isActive ? 'Activo' : 'Inactivo'}</Badge>,
                        <div className="flex gap-2">
                            {!showDeleted ? (
                                <>
                                    <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>Editar</Button>
                                    <Button size="sm" variant="danger" onClick={() => setConfirm({ open: true, title: 'Eliminar Usuario', message: `¿Eliminar a ${u.fullName}?`, onConfirm: () => remove(u.id) })}>Eliminar</Button>
                                </>
                            ) : (
                                <Button size="sm" variant="secondary" onClick={() => setConfirm({ open: true, title: 'Restaurar Usuario', message: `¿Restaurar a ${u.fullName}?`, onConfirm: () => restore(u.id) })}>Restaurar</Button>
                            )}
                        </div>,
                    ])}
                />
            </div>

            <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.edit ? 'Editar Usuario' : 'Nuevo Usuario'}>
                <div className="space-y-4">
                    <Input label="Nombre completo" value={form.fullName} onChange={e => { setForm(f => ({ ...f, fullName: e.target.value })); validate('fullName', e.target.value); }} error={errors.fullName} />
                    <Input label="Email" type="email" value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); validate('email', e.target.value); }} error={errors.email} />
                    <Input label={modal.edit ? 'Contraseña (dejar vacío para mantener)' : 'Contraseña'} type="password" value={form.password} onChange={e => { setForm(f => ({ ...f, password: e.target.value })); validate('password', e.target.value); }} error={errors.password} />
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Rol</label>
                        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'cliente' }))} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
                            <option value="admin">Admin</option>
                            <option value="cliente">Cliente</option>
                        </select>
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
