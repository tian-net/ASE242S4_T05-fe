import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { fetchEventReservationsApi } from '../api/eventReservations.api';
import { fetchReservationsApi } from '../api/reservations.api';
import { fetchCustomersApi } from '../api/customers.api';
import { fetchEventsApi } from '../api/events.api';

export default function DashboardPage() {
    const [stats, setStats] = useState({ reservationsToday: 0, totalCustomers: 0, activeEvents: 0, totalRevenue: 0 });

    useEffect(() => {
        const load = async () => {
            try {
                const [eventRes, tableRes, customers, events] = await Promise.all([
                    fetchEventReservationsApi(),
                    fetchReservationsApi(),
                    fetchCustomersApi(),
                    fetchEventsApi(),
                ]);
                const today = new Date().toISOString().split('T')[0];
                const todayEvent = eventRes.filter((r: any) => r.eventDate === today && !r.isDeleted);
                const todayTable = tableRes.filter((r: any) => r.resDate === today && !r.isDeleted);
                const revenue = eventRes.filter((r: any) => !r.isDeleted).reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0);
                setStats({
                    reservationsToday: todayEvent.length + todayTable.length,
                    totalCustomers: customers.length,
                    activeEvents: events.filter((e: any) => e.isActive).length,
                    totalRevenue: revenue,
                });
            } catch { /* ignore */ }
        };
        load();
    }, []);

    const cards = [
        { label: 'Reservas hoy', value: stats.reservationsToday, color: 'bg-blue-500' },
        { label: 'Clientes registrados', value: stats.totalCustomers, color: 'bg-green-500' },
        { label: 'Eventos activos', value: stats.activeEvents, color: 'bg-yellow-500' },
        { label: 'Ingresos totales', value: `S/ ${stats.totalRevenue.toFixed(2)}`, color: 'bg-purple-500' },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {cards.map((c, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className={`w-12 h-12 ${c.color} rounded-lg flex items-center justify-center mb-3`}>
                            <span className="text-white text-lg font-bold">{typeof c.value === 'string' ? 'S/' : i + 1}</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                        <p className="text-sm text-gray-500">{c.label}</p>
                    </div>
                ))}
            </div>
            <Card title="Bienvenido" subtitle="Panel de administración de ELCHINO Restobar">
                <p className="text-gray-600">Gestiona usuarios, clientes, eventos, reservas y mesas desde los módulos del panel lateral.</p>
            </Card>
        </div>
    );
}
