import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { registerApi } from '../../api/userApi';
import { Link } from 'react-router-dom';
import { required, email, minLength, phone, lettersOnly, docNum, digitsOnly } from '../../lib/validation';

export default function Register() {
    const { login } = useAuth();
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', docType: 'DNI', docNum: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const validate = (field: string, value: string) => {
        const newErrors = { ...errors };
        switch (field) {
            case 'firstName': newErrors.firstName = required(value, 'Nombre') || minLength(3)(value, 'Nombre') || lettersOnly(value, 'Nombre') || ''; break;
            case 'lastName': newErrors.lastName = required(value, 'Apellido') || minLength(3)(value, 'Apellido') || lettersOnly(value, 'Apellido') || ''; break;
            case 'email': newErrors.email = email(value) || ''; break;
            case 'password': newErrors.password = minLength(6)(value, 'Contraseña') || ''; break;
            case 'phone': newErrors.phone = phone(value) || ''; break;
            case 'docNum': newErrors.docNum = docNum(form.docType, value) || digitsOnly(value, 'N° Documento') || ''; break;
        }
        setErrors(newErrors);
    };

    const update = (k: string, v: string) => {
        setForm(f => ({ ...f, [k]: v }));
        validate(k, v);
    };

    const hasErrors = Object.values(errors).some(Boolean) || !form.firstName || !form.lastName || !form.email || !form.password || !form.phone || !form.docNum;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        errs.firstName = required(form.firstName, 'Nombre') || minLength(3)(form.firstName, 'Nombre') || lettersOnly(form.firstName, 'Nombre') || '';
        errs.lastName = required(form.lastName, 'Apellido') || minLength(3)(form.lastName, 'Apellido') || lettersOnly(form.lastName, 'Apellido') || '';
        errs.email = email(form.email) || '';
        errs.password = minLength(6)(form.password, 'Contraseña') || '';
        errs.phone = phone(form.phone) || '';
        errs.docNum = docNum(form.docType, form.docNum) || digitsOnly(form.docNum, 'N° Documento') || '';
        setErrors(errs);
        if (Object.values(errs).some(Boolean)) return;
        setError('');
        setLoading(true);
        try {
            await registerApi(form);
            await login(form.email, form.password);
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Error al registrarse');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-600">ELCHINO</h1>
                    <p className="text-gray-500 mt-1">Crea tu cuenta</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Nombre" value={form.firstName} onChange={e => update('firstName', e.target.value)} error={errors.firstName} required />
                        <Input label="Apellido" value={form.lastName} onChange={e => update('lastName', e.target.value)} error={errors.lastName} required />
                    </div>
                    <Input label="Email" type="email" value={form.email} onChange={e => update('email', e.target.value)} error={errors.email} required />
                    <Input label="Contraseña" type="password" value={form.password} onChange={e => update('password', e.target.value)} error={errors.password} required minLength={6} />
                    <Input label="Teléfono" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} error={errors.phone} required />
                    <div className="grid grid-cols-2 gap-3">
                        <select value={form.docType} onChange={e => update('docType', e.target.value)} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" required>
                            <option value="DNI">DNI</option>
                            <option value="RUC">RUC</option>
                            <option value="CarnetExtranjeria">Carnet Ext.</option>
                            <option value="Pasaporte">Pasaporte</option>
                        </select>
                        <Input value={form.docNum} onChange={e => update('docNum', e.target.value)} error={errors.docNum} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || hasErrors}>{loading ? 'Registrando...' : 'Registrarse'}</Button>
                </form>
                <p className="text-center text-sm text-gray-500 mt-6">
                    ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600 hover:underline font-medium">Inicia sesión</Link>
                </p>
            </div>
        </div>
    );
}
