import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminRoute, ClientRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Customers from './pages/admin/Customers';
import Events from './pages/admin/Events';
import EventReservations from './pages/admin/EventReservations';
import Reservations from './pages/admin/Reservations';
import Tables from './pages/admin/Tables';
import MyReservations from './pages/cliente/MyReservations';
import NewReservation from './pages/cliente/NewReservation';
import EditReservation from './pages/cliente/EditReservation';
import Profile from './pages/cliente/Profile';

function AdminWrapped({ children }: { children: React.ReactNode }) {
    return (
        <AdminRoute>
            <Layout>{children}</Layout>
        </AdminRoute>
    );
}

function ClientWrapped({ children }: { children: React.ReactNode }) {
    return (
        <ClientRoute>
            <Layout>{children}</Layout>
        </ClientRoute>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/admin/dashboard" element={<AdminWrapped><Dashboard /></AdminWrapped>} />
                    <Route path="/admin/users" element={<AdminWrapped><Users /></AdminWrapped>} />
                    <Route path="/admin/customers" element={<AdminWrapped><Customers /></AdminWrapped>} />
                    <Route path="/admin/events" element={<AdminWrapped><Events /></AdminWrapped>} />
                    <Route path="/admin/event-reservations" element={<AdminWrapped><EventReservations /></AdminWrapped>} />
                    <Route path="/admin/reservations" element={<AdminWrapped><Reservations /></AdminWrapped>} />
                    <Route path="/admin/tables" element={<AdminWrapped><Tables /></AdminWrapped>} />
                    <Route path="/cliente/my-reservations" element={<ClientWrapped><MyReservations /></ClientWrapped>} />
                    <Route path="/cliente/new-reservation" element={<ClientWrapped><NewReservation /></ClientWrapped>} />
                    <Route path="/cliente/edit-reservation/:id" element={<ClientWrapped><EditReservation /></ClientWrapped>} />
                    <Route path="/cliente/profile" element={<ClientWrapped><Profile /></ClientWrapped>} />
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
