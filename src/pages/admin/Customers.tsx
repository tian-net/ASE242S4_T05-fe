import { useState } from 'react';
import { useCustomers } from '../../hooks/useCustomer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Table } from '../../components/ui/Table';
import { SearchBar } from '../../components/ui/SearchBar';
import { FilterSelect } from '../../components/ui/FilterSelect';
import { required, email, phone, docNum, lettersOnly, digitsOnly, minLength } from '../../lib/validation';

export default function Customers() {
    const { customers, deleted, loading, create, update, remove, restore, reload } = useCustomers();
    const [modal, setModal] = useState<{ open: boolean; edit?: any }>({ open: false });
    const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });
    const [form, setForm] = useState<{ firstName: string; lastName: string; phone: string; email: string; docType: 'DNI' | 'RUC' | 'CarnetExtranjeria' | 'Pasaporte'; docNum: string }>({ firstName: '', lastName: '', phone: '', email: '', docType: 'DNI', docNum: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showDeleted, setShowDeleted] = useState(false);
    const [search, setSearch] = useState('');
    const [docFilter, setDocFilter] = useState('');
    const list = showDeleted ? deleted : customers;

    const validate = (field: string, value: any) => {
        const newErrors = { ...errors };
        switch (field) {
            case 'firstName': newErrors.firstName = required(value, 'Nombre') || minLength(3)(value, 'Nombre') || lettersOnly(value, 'Nombre') || ''; break;
            case 'lastName': newErrors.lastName = required(value, 'Apellido') || minLength(3)(value, 'Apellido') || lettersOnly(value, 'Apellido') || ''; break;
            case 'email': newErrors.email = email(value) || ''; break;
            case 'phone': newErrors.phone = phone(value) || ''; break;
            case 'docNum': newErrors.docNum = docNum(form.docType, value) || digitsOnly(value, 'N° Documento') || ''; break;
        }
        setErrors(newErrors);
    };

    const openCreate = () => {
        setForm({ firstName: '', lastName: '', phone: '', email: '', docType: 'DNI', docNum: '' });
        setErrors({});
        setModal({ open: true });
    };

    const openEdit = (c: any) => {
        setForm({ firstName: c.firstName, lastName: c.lastName, phone: c.phone, email: c.email, docType: c.docType, docNum: c.docNum });
        setErrors({});
        setModal({ open: true, edit: c });
    };

    const handleSave = async () => {
        const errs: Record<string, string> = {};
        errs.firstName = required(form.firstName, 'Nombre') || minLength(3)(form.firstName, 'Nombre') || lettersOnly(form.firstName, 'Nombre') || '';
        errs.lastName = required(form.lastName, 'Apellido') || minLength(3)(form.lastName, 'Apellido') || lettersOnly(form.lastName, 'Apellido') || '';
        errs.email = email(form.email) || '';
        errs.phone = phone(form.phone) || '';
        errs.docNum = docNum(form.docType, form.docNum) || digitsOnly(form.docNum, 'N° Documento') || '';
        setErrors(errs);
        if (Object.values(errs).some(Boolean)) return;
        if (modal.edit) await update(modal.edit.id, form);
        else await create(form as any);
        setModal({ open: false });
    };

    const hasErrors = Object.values(errors).some(Boolean) || !form.firstName || !form.lastName || !form.email || !form.phone || !form.docNum;

    const filtered = list.filter((c: any) => {
        const s = search.toLowerCase();
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        const matchSearch = !s || fullName.includes(s) || c.email?.toLowerCase().includes(s) || c.docNum?.toLowerCase().includes(s);
        const matchDoc = !docFilter || c.docType === docFilter;
        return matchSearch && matchDoc;
    });

    if (loading) return <div className="text-center py-8 text-gray-400">Cargando...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => { setShowDeleted(!showDeleted); reload(); }}>{showDeleted ? 'Activos' : 'Eliminados'}</Button>
                    {!showDeleted && <Button onClick={openCreate}>+ Nuevo</Button>}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <SearchBar value={search} onChange={setSearch} placeholder="Buscar nombre, email o doc..." />
                <FilterSelect label="Doc." value={docFilter} onChange={setDocFilter} options={[{ value: '', label: 'Todos' }, { value: 'DNI', label: 'DNI' }, { value: 'RUC', label: 'RUC' }, { value: 'CarnetExtranjeria', label: 'Carnet Ext.' }, { value: 'Pasaporte', label: 'Pasaporte' }]} />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <Table
                    headers={['Nombre', 'Email', 'Teléfono', 'Doc.', 'Acciones']}
                    rows={filtered.map((c: any) => [
                        `${c.firstName} ${c.lastName}`,
                        c.email,
                        c.phone,
                        `${c.docType}: ${c.docNum}`,
                        <div className="flex gap-2">
                            {!showDeleted ? (
                                <>
                                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>Editar</Button>
                                    <Button size="sm" variant="danger" onClick={() => setConfirm({ open: true, title: 'Eliminar Cliente', message: `¿Eliminar a ${c.firstName} ${c.lastName}?`, onConfirm: () => remove(c.id) })}>Eliminar</Button>
                                </>
                            ) : (
                                <Button size="sm" variant="secondary" onClick={() => setConfirm({ open: true, title: 'Restaurar Cliente', message: `¿Restaurar a ${c.firstName} ${c.lastName}?`, onConfirm: () => restore(c.id) })}>Restaurar</Button>
                            )}
                        </div>,
                    ])}
                />
            </div>

            <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.edit ? 'Editar Cliente' : 'Nuevo Cliente'}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Nombre" value={form.firstName} onChange={e => { setForm(f => ({ ...f, firstName: e.target.value })); validate('firstName', e.target.value); }} error={errors.firstName} />
                        <Input label="Apellido" value={form.lastName} onChange={e => { setForm(f => ({ ...f, lastName: e.target.value })); validate('lastName', e.target.value); }} error={errors.lastName} />
                    </div>
                    <Input label="Email" type="email" value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); validate('email', e.target.value); }} error={errors.email} />
                    <Input label="Teléfono" value={form.phone} onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); validate('phone', e.target.value); }} error={errors.phone} />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Tipo Doc.</label>
                            <select value={form.docType} onChange={e => setForm(f => ({ ...f, docType: e.target.value as 'DNI' | 'RUC' | 'CarnetExtranjeria' | 'Pasaporte' }))} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
                                <option value="DNI">DNI</option>
                                <option value="RUC">RUC</option>
                                <option value="CarnetExtranjeria">Carnet Ext.</option>
                                <option value="Pasaporte">Pasaporte</option>
                            </select>
                        </div>
                        <Input label="N° Doc." value={form.docNum} onChange={e => { setForm(f => ({ ...f, docNum: e.target.value })); validate('docNum', e.target.value); }} error={errors.docNum} />
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
