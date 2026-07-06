import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchMyEventReservationsApi, cancelEventReservationApi } from '../api/eventReservations.api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { STATUS_COLORS } from '../lib/constants';
import { useNavigate } from 'react-router-dom';

export default function MyReservationsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });

    const load = async () => {
        if (!user?.customer?.id) { setLoading(false); return; }
        setLoading(true);
        try {
            const data = await fetchMyEventReservationsApi(user.customer.id);
            setReservations(data);
        } catch {
            setReservations([]);
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [user]);

    const handleCancel = async (id: string) => { await cancelEventReservationApi(id); await load(); };

    const canEdit = (r: any) => {
        const statusOk = r.status === 'pendiente' || r.status === 'Planificado';
        const earliestDate = (r.details || []).length > 0
            ? new Date(Math.min(...(r.details || []).map((d: any) => new Date(d.eventDate + 'T00:00:00').getTime())))
            : new Date('2099-01-01');
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 2);
        return statusOk && earliestDate >= minDate;
    };

    if (loading) return <div className="text-center py-8 text-gray-400">Cargando...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Mis Reservas</h2>
                <Button onClick={() => navigate('/cliente/new-reservation')}>+ Nueva Reserva</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reservations.map((r: any) => (
                    <Card key={r.id} className="relative">
                        <div className="flex items-center justify-between mb-3">
                            <Badge className={STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-800'}>{r.status}</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                            {(r.details || []).map((d: any, i: number) => (
                                <div key={i} className="border-b border-gray-100 pb-2 mb-1 last:border-0">
                                    <p className="font-medium text-gray-800">{d.eventName || 'Evento'}</p>
                                    <p>{d.eventDate} · {d.startTime?.substring(0, 5)} - {d.endTime?.substring(0, 5)}</p>
                                    <p><span className="font-medium">Invitados:</span> {d.totalPeople} {d.notes && <span>· Notas: {d.notes}</span>}</p>
                                </div>
                            ))}
                            <p><span className="font-medium">Monto:</span> S/ {r.totalAmount?.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2 mt-4 pt-3 border-t">
                            {canEdit(r) && (
                                <Button size="sm" variant="primary" onClick={() => navigate(`/cliente/edit-reservation/${r.id}`)}>Editar</Button>
                            )}
                            {r.status !== 'Cancelado' && r.status !== 'cancelada' && (
                                <Button size="sm" variant="danger" onClick={() => setConfirm({ open: true, title: 'Cancelar Reserva', message: '¿Cancelar esta reserva?', onConfirm: () => handleCancel(r.id) })}>Cancelar</Button>
                            )}
                        </div>
                    </Card>
                ))}
                {reservations.length === 0 && <p className="col-span-full text-center text-gray-400 py-8">No tienes reservas</p>}
            </div>
            <ConfirmDialog open={confirm.open} title={confirm.title} message={confirm.message} onConfirm={() => { confirm.onConfirm(); setConfirm(c => ({ ...c, open: false })); }} onCancel={() => setConfirm(c => ({ ...c, open: false }))} />
        </div>
    );
}
