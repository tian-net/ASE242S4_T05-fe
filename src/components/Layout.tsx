import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
    children: ReactNode;
}

const adminNav = [
    { label: 'Dashboard', path: '/admin/dashboard' },
    { label: 'Usuarios', path: '/admin/users' },
    { label: 'Clientes', path: '/admin/customers' },
    { label: 'Eventos', path: '/admin/events' },
    { label: 'Reservas de Evento', path: '/admin/event-reservations' },
    { label: 'Reservas de Mesa', path: '/admin/reservations' },
    { label: 'Mesas', path: '/admin/tables' },
];

const clientNav = [
    { label: 'Mis Reservas', path: '/cliente/my-reservations' },
    { label: 'Nueva Reserva', path: '/cliente/new-reservation' },
    { label: 'Perfil', path: '/cliente/profile' },
];

export function Layout({ children }: LayoutProps) {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const nav = isAdmin ? adminNav : clientNav;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/cliente/my-reservations')}>
                        ELCHINO
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{user?.fullName}</span>
                        <button onClick={logout} className="text-sm text-red-600 hover:text-red-700 font-medium">Cerrar sesión</button>
                    </div>
                </div>
            </header>
            <div className="flex flex-1">
                <aside className="w-64 bg-white border-r border-gray-200 hidden md:block shrink-0">
                    <nav className="p-4 space-y-1">
                        {nav.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="flex-1 p-6 overflow-auto">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
            {/* Mobile bottom nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
                <div className="flex overflow-x-auto">
                    {nav.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex-1 shrink-0 px-3 py-3 text-xs font-medium text-center ${location.pathname === item.path ? 'text-blue-600 border-t-2 border-blue-600' : 'text-gray-500'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
}
