import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { AdminRoute, ClientRoute } from './router/ProtectedRoute';
import { AppLayout } from './layout/AppLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import CustomersPage from './pages/CustomersPage';
import EventsPage from './pages/EventsPage';
import EventReservationsPage from './pages/EventReservationsPage';
import ReservationsPage from './pages/ReservationsPage';
import TablesPage from './pages/TablesPage';
import MyReservationsPage from './pages/MyReservationsPage';
import NewReservationPage from './pages/NewReservationPage';
import EditReservationPage from './pages/EditReservationPage';
import ProfilePage from './pages/ProfilePage';

function AdminWrapped({ children }: { children: React.ReactNode }) {
    return (
        <AdminRoute>
            <AppLayout>{children}</AppLayout>
        </AdminRoute>
    );
}

function ClientWrapped({ children }: { children: React.ReactNode }) {
    return (
        <ClientRoute>
            <AppLayout>{children}</AppLayout>
        </ClientRoute>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/admin/dashboard" element={<AdminWrapped><DashboardPage /></AdminWrapped>} />
                    <Route path="/admin/users" element={<AdminWrapped><UsersPage /></AdminWrapped>} />
                    <Route path="/admin/customers" element={<AdminWrapped><CustomersPage /></AdminWrapped>} />
                    <Route path="/admin/events" element={<AdminWrapped><EventsPage /></AdminWrapped>} />
                    <Route path="/admin/event-reservations" element={<AdminWrapped><EventReservationsPage /></AdminWrapped>} />
                    <Route path="/admin/reservations" element={<AdminWrapped><ReservationsPage /></AdminWrapped>} />
                    <Route path="/admin/tables" element={<AdminWrapped><TablesPage /></AdminWrapped>} />
                    <Route path="/cliente/my-reservations" element={<ClientWrapped><MyReservationsPage /></ClientWrapped>} />
                    <Route path="/cliente/new-reservation" element={<ClientWrapped><NewReservationPage /></ClientWrapped>} />
                    <Route path="/cliente/edit-reservation/:id" element={<ClientWrapped><EditReservationPage /></ClientWrapped>} />
                    <Route path="/cliente/profile" element={<ClientWrapped><ProfilePage /></ClientWrapped>} />
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
