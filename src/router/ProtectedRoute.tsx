import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { token, loading } = useAuth();
    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
    if (!token) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
    const { isAdmin, token, loading } = useAuth();
    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
    if (!token) return <Navigate to="/login" replace />;
    if (!isAdmin) return <Navigate to="/cliente/my-reservations" replace />;
    return <>{children}</>;
}

export function ClientRoute({ children }: { children: React.ReactNode }) {
    const { isCliente, token, loading } = useAuth();
    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
    if (!token) return <Navigate to="/login" replace />;
    if (!isCliente) return <Navigate to="/admin/dashboard" replace />;
    return <>{children}</>;
}
