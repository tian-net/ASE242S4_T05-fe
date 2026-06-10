import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { checkEventAvailabilityApi, fetchEventReservationByIdApi, updateEventReservationApi } from '../api/eventReservations.api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { MINIMUM_HOURS } from '../lib/constants';

interface DetailEdit {
    id: number;
    eventId: string;
    eventName: string;
    eventDate: Date | null;
    startTime: string;
    endTime: string;
    reservationType: string;
    quantityHours: number;
    pricePerHour: number;
    pricePerDay: number;
    totalAmount: number;
    totalPeople: number;
    notes: string;
    conflictMsg: string;
}

export default function EditReservationPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [reservation, setReservation] = useState<any>(null);
    const [details, setDetails] = useState<DetailEdit[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const r = await fetchEventReservationByIdApi(id);
                setReservation(r);
                setDetails((r.details || []).map((d: any, i: number) => ({
                    id: i,
                    eventId: d.eventId,
                    eventName: d.eventName || '',
                    eventDate: d.eventDate ? new Date(d.eventDate + 'T00:00:00') : null,
                    startTime: d.startTime?.substring(0, 5) || '',
                    endTime: d.endTime?.substring(0, 5) || '',
                    reservationType: d.reservationType || 'hora',
                    quantityHours: d.quantityHours || 0,
                    pricePerHour: d.pricePerHour || 0,
                    pricePerDay: d.pricePerDay || 0,
                    totalAmount: d.totalAmount || 0,
                    totalPeople: d.totalPeople || 1,
                    notes: d.notes || '',
                    conflictMsg: '',
                })));
            } catch { setError('Error al cargar reserva'); }
            finally { setInitialLoading(false); }
        };
        load();
    }, [id]);

    let conflictTimer: ReturnType<typeof setTimeout>;
    const checkConflict = async (d: DetailEdit) => {
        if (!d.eventDate || !d.startTime || !d.endTime) return;
        const dateStr = d.eventDate.toISOString().split('T')[0];
        try {
            const res = await checkEventAvailabilityApi({
                eventDate: dateStr,
                startTime: d.startTime + ':00',
                endTime: d.endTime + ':00',
                reservationType: d.reservationType,
                excludeId: id,
            });
            setDetails(prev => prev.map(pd => pd.id === d.id ? { ...pd, conflictMsg: res.available ? '' : (res.conflicts[0]?.message || 'Conflicto de horario') } : pd));
        } catch {
            setDetails(prev => prev.map(pd => pd.id === d.id ? { ...pd, conflictMsg: '' } : pd));
        }
    };

    const updateDetail = (idx: number, field: string, value: any) => {
        setDetails(details.map((d, i) => {
            if (i !== idx) return d;
            const updated = { ...d, [field]: value };
            if (field === 'startTime' || field === 'endTime') {
                if (updated.startTime && updated.endTime) {
                    const [sh, sm] = updated.startTime.split(':').map(Number);
                    const [eh, em] = updated.endTime.split(':').map(Number);
                    const hours = (eh + em / 60) - (sh + sm / 60);
                    updated.quantityHours = Math.ceil(hours);
                    if (hours >= 8 && updated.pricePerDay) updated.reservationType = 'dia';
                    else updated.reservationType = 'hora';
                }
            }
            if (field === 'eventDate' || field === 'startTime' || field === 'endTime') {
                clearTimeout(conflictTimer);
                conflictTimer = setTimeout(() => checkConflict(updated), 500);
            }
            return updated;
        }));
    };

    const handleSubmit = async () => {
        if (!id) return;
        setError('');
        setLoading(true);
        try {
            await updateEventReservationApi(id, {
                details: details.map(d => {
                    const dateStr = d.eventDate ? d.eventDate.toISOString().split('T')[0] : '';
                    return {
                        eventId: d.eventId,
                        eventDate: dateStr,
                        startTime: d.startTime ? d.startTime + ':00' : null,
                        endTime: d.endTime ? d.endTime + ':00' : null,
                        reservationType: d.reservationType,
                        quantityHours: d.quantityHours,
                        totalPeople: d.totalPeople,
                        notes: d.notes,
                    };
                }),
            });
            navigate('/cliente/my-reservations', { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Error al actualizar');
        } finally { setLoading(false); }
    };

    const calcTotal = () => details.reduce((sum, d) => sum + (d.totalAmount || 0), 0);

    const editHasErrors = details.length === 0 || details.some(d => d.conflictMsg);

    if (initialLoading) return <div className="text-center py-8 text-gray-400">Cargando...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Reserva</h2>

            {reservation && (
                <Card>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-700">Eventos seleccionados:</h3>
                            {details.map((d, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">Evento {idx + 1}: {d.eventName}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-500">Hora inicio</label>
                                            <input type="time" value={d.startTime} onChange={e => updateDetail(idx, 'startTime', e.target.value)}
                                                className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-500">Hora fin</label>
                                            <input type="time" value={d.endTime} onChange={e => updateDetail(idx, 'endTime', e.target.value)}
                                                className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-500">Invitados</label>
                                            <input type="number" value={d.totalPeople} onChange={e => updateDetail(idx, 'totalPeople', Number(e.target.value))} min={1}
                                                className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium text-gray-500">Notas</label>
                                            <input value={d.notes} onChange={e => updateDetail(idx, 'notes', e.target.value)}
                                                className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">{d.quantityHours}h · {d.reservationType === 'dia' ? 'Día completo' : 'Por hora'}</p>
                                    {d.conflictMsg && <p className="text-xs text-yellow-700 bg-yellow-50 p-1 rounded">⚠️ {d.conflictMsg}</p>}
                                </div>
                            ))}
                        </div>

                        <p className="text-sm font-medium text-blue-600">Total: S/ {calcTotal().toFixed(2)}</p>

                        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

                        <div className="flex gap-2 pt-2">
                            <Button variant="secondary" onClick={() => navigate('/cliente/my-reservations')}>Cancelar</Button>
                            <Button onClick={handleSubmit} disabled={loading || editHasErrors}>
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
