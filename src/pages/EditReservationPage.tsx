import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventReservationByIdApi, fetchOccupiedTimesApi, updateEventReservationApi } from '../api/eventReservations.api';
import { fetchEventByIdApi } from '../api/events.api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { futureDate, timeAfter, minDuration, positiveNumber } from '../lib/validation';
import { MINIMUM_HOURS } from '../lib/constants';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function EditReservationPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [reservation, setReservation] = useState<any>(null);
    const [event, setEvent] = useState<any>(null);
    const [date, setDate] = useState<Date | null>(null);
    const [startTime, setStartTime] = useState('18:00');
    const [endTime, setEndTime] = useState('22:00');
    const [totalPeople, setTotalPeople] = useState(20);
    const [notes, setNotes] = useState('');
    const [occupied, setOccupied] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const dateStr = date ? date.toISOString().split('T')[0] : '';

    const validate = (field: string, value: any) => {
        const newErrors = { ...errors };
        switch (field) {
            case 'date':
                newErrors.date = futureDate(dateStr, 2) || '';
                break;
            case 'startTime':
            case 'endTime':
                newErrors.startTime = '';
                newErrors.endTime = '';
                if (startTime && endTime) {
                    const t = timeAfter(startTime, endTime);
                    if (t) newErrors.endTime = t;
                    else {
                        const minHrs = event ? (MINIMUM_HOURS[event.eventType] || 1) : 1;
                        const d = minDuration(startTime, endTime, minHrs, event?.name || 'evento');
                        if (d) newErrors.endTime = d;
                        else {
                            const hrs = calcDuration();
                            if (hrs > 8) newErrors.endTime = 'La duración máxima es de 8 horas. Para duraciones mayores, contacte al administrador.';
                        }
                    }
                }
                break;
            case 'totalPeople':
                newErrors.totalPeople = positiveNumber(value, 'Invitados') || '';
                if (value > (event?.maxCapacity || 999)) newErrors.totalPeople = `Máximo ${event?.maxCapacity} invitados`;
                break;
        }
        setErrors(newErrors);
    };

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const r = await fetchEventReservationByIdApi(id);
                setReservation(r);
                setDate(new Date(r.eventDate));
                setStartTime(r.startTime.substring(0, 5));
                setEndTime(r.endTime.substring(0, 5));
                setTotalPeople(r.totalPeople);
                setNotes(r.notes || '');
                const e = await fetchEventByIdApi(r.eventId);
                setEvent(e);
            } catch { setError('Error al cargar reserva'); }
            finally { setInitialLoading(false); }
        };
        load();
    }, [id]);

    useEffect(() => {
        if (!date) return;
        const dateStr = date.toISOString().split('T')[0];
        fetchOccupiedTimesApi(dateStr).then(setOccupied).catch(() => {});
    }, [date]);

    const getMinHours = () => {
        if (!event) return 1;
        return MINIMUM_HOURS[event.eventType] || 1;
    };

    const calcDuration = () => {
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        return (eh + em / 60) - (sh + sm / 60);
    };

    const isTimeOccupied = () => {
        return occupied.some((o: any) => {
            if (o.id === id) return false;
            const aS = startTime, aE = endTime;
            const bS = o.startTime.substring(0, 5), bE = o.endTime.substring(0, 5);
            return aS < bE && aE > bS;
        });
    };

    const handleSubmit = async () => {
        if (!id) return;
        setError('');
        setLoading(true);
        try {
            const dateStr = date!.toISOString().split('T')[0];
            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            const hours = (eh + em / 60) - (sh + sm / 60);
            const isFullDay = event?.pricePerDay && hours >= 8;
            await updateEventReservationApi(id, {
                customerId: reservation.customerId,
                eventId: reservation.eventId,
                eventDate: dateStr,
                startTime: startTime + ':00',
                endTime: endTime + ':00',
                reservationType: isFullDay ? 'dia' : 'hora',
                quantityHours: Math.ceil(hours),
                totalPeople,
                totalAmount: isFullDay ? (event?.pricePerDay || 0) : (event?.pricePerHour || 0) * Math.ceil(hours),
                pricePerHour: event?.pricePerHour || 0,
                pricePerDay: event?.pricePerDay || 0,
                venueCapacity: event?.maxCapacity || 0,
                notes,
            });
            navigate('/cliente/my-reservations', { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Error al actualizar');
        } finally {
            setLoading(false);
        }
    };

    const editHasErrors = Object.values(errors).some(Boolean) || !date || !startTime || !endTime || calcDuration() < getMinHours() || calcDuration() > 8 || totalPeople > (event?.maxCapacity || 999) || isTimeOccupied();

    if (initialLoading) return <div className="text-center py-8 text-gray-400">Cargando...</div>;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Reserva</h2>

            {reservation && event && (
                <Card>
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Tipo de evento (no editable)</p>
                        <p className="text-lg font-semibold text-gray-900">{event.name}</p>
                        <p className="text-sm text-gray-500">{event.eventType} · Cap. {event.maxCapacity} · S/ {event.pricePerHour}/hora</p>
                    </div>

                    <div className="space-y-6">
                        <Calendar
                            onChange={(v) => { setDate(v as Date); validate('date', v); }}
                            value={date}
                            minDate={tomorrow}
                            maxDate={maxDate}
                            className="w-full border-0"
                        />
                        {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}

                        {date && occupied.filter((o: any) => o.id !== id).length > 0 && (
                            <div className="bg-red-50 p-3 rounded-lg">
                                <p className="text-sm font-medium text-red-700 mb-2">Horarios ocupados en esta fecha:</p>
                                {occupied.filter((o: any) => o.id !== id).map((o: any, i: number) => (
                                    <p key={i} className="text-sm text-red-600">🔴 {o.startTime?.substring(0, 5)} - {o.endTime?.substring(0, 5)} ({o.eventName || 'Evento'})</p>
                                ))}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">Hora inicio</label>
                                <input type="time" value={startTime} onChange={e => { setStartTime(e.target.value); validate('startTime', e.target.value); }} className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.startTime ? 'border-red-400' : 'border-gray-300'}`} />
                                {errors.startTime && <span className="text-xs text-red-600">{errors.startTime}</span>}
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">Hora fin</label>
                                <input type="time" value={endTime} onChange={e => { setEndTime(e.target.value); validate('endTime', e.target.value); }} className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.endTime ? 'border-red-400' : 'border-gray-300'}`} />
                                {errors.endTime && <span className="text-xs text-red-600">{errors.endTime}</span>}
                            </div>
                        </div>

                        {startTime && endTime && calcDuration() > 8 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-amber-600 text-xl leading-none mt-0.5">⚠️</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-amber-800">Duración excede el límite permitido</p>
                                        <p className="text-xs text-amber-700 mt-1">La duración máxima por reserva es de 8 horas. Has seleccionado {calcDuration().toFixed(1)} horas. Para duraciones mayores, contacta directamente al administrador o dueño del local.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Invitados</label>
                            <input type="number" value={totalPeople} onChange={e => { setTotalPeople(Number(e.target.value)); validate('totalPeople', Number(e.target.value)); }} min={1} max={event.maxCapacity} className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.totalPeople ? 'border-red-400' : 'border-gray-300'}`} />
                            {errors.totalPeople && <span className="text-xs text-red-600">{errors.totalPeople}</span>}
                            {!errors.totalPeople && <span className="text-xs text-gray-400">Máximo {event.maxCapacity} invitados</span>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Notas</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" />
                        </div>

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
