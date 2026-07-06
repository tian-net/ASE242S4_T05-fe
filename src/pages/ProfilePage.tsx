import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h2>
            <Card>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 pb-4 border-b">
                        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                            {user.fullName.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">{user.fullName}</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">{user.role}</span>
                        </div>
                    </div>
                    {user.customer && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Teléfono</p>
                                <p className="font-medium text-gray-900">{user.customer.phone}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Documento</p>
                                <p className="font-medium text-gray-900">{user.customer.docType}: {user.customer.docNum}</p>
                            </div>
                        </div>
                    )}
                    <div className="pt-4 border-t flex gap-2">
                        <Button variant="secondary" onClick={() => navigate('/cliente/my-reservations')}>Mis Reservas</Button>
                        <Button variant="danger" onClick={logout}>Cerrar Sesión</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
