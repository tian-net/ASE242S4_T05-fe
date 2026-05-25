import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchActiveEnabledEventsApi } from '../api/events.api';
import { fetchReservableTablesApi } from '../api/tables.api';
import { createReservationApi } from '../api/reservations.api';
import { fetchOccupiedTimesApi, createEventReservationApi } from '../api/eventReservations.api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Stepper } from '../components/ui/Stepper';
import { futureDate, timeAfter, minDuration, positiveNumber } from '../lib/validation';
import { MINIMUM_HOURS } from '../lib/constants';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function NewReservationPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [resType, setResType] = useState<'evento' | 'mesa' | null>(null);
    const [step, setStep] = useState(0);
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [date, setDate] = useState<Date | null>(null);
    const [startTime, setStartTime] = useState('18:00');
    const [endTime, setEndTime] = useState('22:00');
    const [totalPeople, setTotalPeople] = useState(20);
    const [notes, setNotes] = useState('');
    const [occupied, setOccupied] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [tables, setTables] = useState<any[]>([]);
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const dateStr = date ? date.toISOString().split('T')[0] : '';

    const validate = (field: string, value: any) => {
        const newErrors = { ...errors };
        switch (field) {
            case 'date':
                newErrors.date = futureDate(dateStr, 1) || '';
                break;
            case 'startTime':
            case 'endTime':
                newErrors.startTime = '';
                newErrors.endTime = '';
                if (startTime && endTime) {
                    const t = timeAfter(startTime, endTime);
                    if (t) newErrors.endTime = t;
                    else {
                        const minHrs = selectedEvent ? (MINIMUM_HOURS[selectedEvent.eventType] || 1) : 1;
                        const d = minDuration(startTime, endTime, minHrs, selectedEvent?.name || 'evento');
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
                if (value > (selectedEvent?.maxCapacity || 999)) newErrors.totalPeople = `Máximo ${selectedEvent?.maxCapacity} invitados`;
                break;
            case 'selectedTables':
                newErrors.selectedTables = value.length === 0 ? 'Selecciona al menos una mesa' : '';
                break;
        }
        setErrors(newErrors);
    };

    useEffect(() => {
        fetchActiveEnabledEventsApi().then(setEvents).catch(() => {});
        fetchReservableTablesApi().then(setTables).catch(() => {});
    }, []);

    useEffect(() => {
        if (!date) return;
        const dateStr = date.toISOString().split('T')[0];
        fetchOccupiedTimesApi(dateStr).then(setOccupied).catch(() => {});
    }, [date]);

    const selectEvent = (e: any) => { setSelectedEvent(e); setStep(1); };

    const getMinHours = () => {
        if (!selectedEvent) return 1;
        return MINIMUM_HOURS[selectedEvent.eventType] || 1;
    };

    const calcDuration = () => {
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        return (eh + em / 60) - (sh + sm / 60);
    };

    const isTimeOccupied = () => {
        return occupied.some((o: any) => {
            const aS = startTime, aE = endTime;
            const bS = o.startTime.substring(0, 5), bE = o.endTime.substring(0, 5);
            return aS < bE && aE > bS;
        });
    };

    const handleSubmitEvento = async () => {
        if (!selectedEvent || !date || !user?.customer?.id) return;
        setError('');
        setLoading(true);
        try {
            const dateStr = date.toISOString().split('T')[0];
            const hours = calcDuration();
            let totalAmount = 0;
            if (selectedEvent.pricePerDay && hours >= 8) {
                totalAmount = selectedEvent.pricePerDay;
            } else {
                totalAmount = selectedEvent.pricePerHour * hours;
            }
            await createEventReservationApi({
                customerId: user.customer.id,
                eventId: selectedEvent.id,
                eventDate: dateStr,
                startTime: startTime + ':00',
                endTime: endTime + ':00',
                reservationType: (selectedEvent.pricePerDay && hours >= 8) ? 'dia' : 'hora',
                quantityHours: Math.ceil(hours),
                pricePerHour: selectedEvent.pricePerHour,
                pricePerDay: selectedEvent.pricePerDay,
                totalAmount,
                totalPeople,
                notes,
            });
            navigate('/cliente/my-reservations', { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Error al crear reserva');
        } finally { setLoading(false); }
    };

    const handleSubmitMesa = async () => {
        if (!date || !user?.customer?.id || selectedTables.length === 0) return;
        setError('');
        setLoading(true);
        try {
            const dateStr = date.toISOString().split('T')[0];
            await createReservationApi({
                customerId: user.customer.id,
                resDate: dateStr,
                resTime: startTime + ':00',
                numPeople: totalPeople,
                details: selectedTables.map(id => ({ tableId: id, notes: '' })),
            });
            navigate('/cliente/my-reservations', { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Error al crear reserva de mesa');
        } finally { setLoading(false); }
    };

    const mesaHasErrors = Object.values(errors).some(Boolean) || !date || selectedTables.length === 0;

    const eventoHasErrors = Object.values(errors).some(Boolean) || !date || !startTime || !endTime || calcDuration() < getMinHours() || calcDuration() > 8 || totalPeople > (selectedEvent?.maxCapacity || 999) || isTimeOccupied();

    const toggleTable = (id: string) => {
        const table = tables.find(t => t.id === id);
        if (table && table.status !== 'AVAILABLE') return;
        const next = selectedTables.includes(id) ? selectedTables.filter(t => t !== id) : [...selectedTables, id];
        setSelectedTables(next);
        validate('selectedTables', next);
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);

    if (!resType) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Nueva Reserva</h2>
                <p className="text-gray-500 mb-6">¿Qué tipo de reserva deseas hacer?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    <div onClick={() => setResType('evento')} className="cursor-pointer">
                        <Card className="border-2 border-gray-200 hover:border-blue-500 transition-colors text-center py-8">
                            <p className="text-4xl mb-3">🎉</p>
                            <h3 className="text-lg font-semibold text-gray-900">Reserva de Evento</h3>
                            <p className="text-sm text-gray-500 mt-1">Cumpleaños, bodas, conferencias y más</p>
                        </Card>
                    </div>
                    <div onClick={() => setResType('mesa')} className="cursor-pointer">
                        <Card className="border-2 border-gray-200 hover:border-blue-500 transition-colors text-center py-8">
                            <p className="text-4xl mb-3">🍽️</p>
                            <h3 className="text-lg font-semibold text-gray-900">Reserva de Mesa</h3>
                            <p className="text-sm text-gray-500 mt-1">Reserva una mesa para tu visita</p>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (resType === 'mesa') {
        return (
            <div>
                <div className="flex items-center gap-2 mb-6">
                    <Button variant="ghost" onClick={() => setResType(null)}>← Volver</Button>
                    <h2 className="text-2xl font-bold text-gray-900">Nueva Reserva de Mesa</h2>
                </div>
                <div className="max-w-2xl space-y-6">
                    <Card>
                        <Calendar onChange={(v) => { setDate(v as Date); validate('date', v); }} value={date} minDate={tomorrow} maxDate={maxDate} className="w-full border-0" />
                        {errors.date && <p className="text-xs text-red-600 mt-1 px-1">{errors.date}</p>}
                    </Card>
                    {date && (
                        <Card>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Hora</label>
                                    <input type="time" value={startTime} onChange={e => { setStartTime(e.target.value); validate('startTime', e.target.value); }} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Personas</label>
                                    <input type="number" value={totalPeople} onChange={e => { setTotalPeople(Number(e.target.value)); validate('totalPeople', Number(e.target.value)); }} min={1} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" />
                                    {errors.totalPeople && <span className="text-xs text-red-600">{errors.totalPeople}</span>}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 mb-4">
                                <label className="text-sm font-medium text-gray-700">Selecciona mesas disponibles</label>
                                {errors.selectedTables && <span className="text-xs text-red-600">{errors.selectedTables}</span>}
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                                    {tables.map((t: any) => {
                                        const isAvail = t.status === 'AVAILABLE';
                                        const selected = selectedTables.includes(t.id);
                                        return (
                                            <label key={t.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${selected ? 'bg-blue-50 border border-blue-300' : isAvail ? 'bg-gray-50 border border-gray-200' : 'bg-gray-100 border border-gray-200 opacity-60'}`}>
                                                <input type="checkbox" checked={selected} disabled={!isAvail} onChange={() => toggleTable(t.id)} className="rounded" />
                                                <span className="flex-1">Mesa {t.tableNum} ({t.capacity} pers.)</span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${isAvail ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isAvail ? 'Libre' : 'Ocupada'}</span>
                                            </label>
                                        );
                                    })}
                                    {tables.length === 0 && <p className="text-gray-400 text-sm col-span-2">No hay mesas disponibles</p>}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 mb-4">
                                <label className="text-sm font-medium text-gray-700">Notas</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" />
                            </div>
                            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
                            <Button onClick={handleSubmitMesa} disabled={loading || mesaHasErrors}>
                                {loading ? 'Creando...' : 'Reservar Mesa'}
                            </Button>
                        </Card>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-2 mb-6">
                <Button variant="ghost" onClick={() => { setResType(null); setStep(0); setSelectedEvent(null); }}>← Volver</Button>
                <h2 className="text-2xl font-bold text-gray-900">Nueva Reserva de Evento</h2>
            </div>
            <Stepper steps={['Evento', 'Fecha y Hora', 'Confirmar']} currentStep={step} />

            {step === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((e: any) => (
                        <div key={e.id} onClick={() => selectEvent(e)} className="cursor-pointer">
                            <Card className={`border-2 transition-colors ${selectedEvent?.id === e.id ? 'border-blue-500' : 'border-gray-200 hover:border-blue-300'}`}>
                                <h3 className="text-lg font-semibold text-gray-900">{e.name}</h3>
                                <p className="text-sm text-gray-500">{e.eventType}</p>
                                <div className="mt-3 space-y-1 text-sm text-gray-600">
                                    <p>👥 Capacidad: {e.maxCapacity} pers.</p>
                                    <p>💰 S/ {e.pricePerHour}/hora {e.pricePerDay ? `| S/ ${e.pricePerDay}/día` : ''}</p>
                                    <p>⏱ Duración min: {MINIMUM_HOURS[e.eventType] || 1}h</p>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            )}

            {step === 1 && selectedEvent && (
                <div className="space-y-6 max-w-2xl">
                    <Card>
                        <Calendar onChange={(v) => { setDate(v as Date); validate('date', v); }} value={date} minDate={tomorrow} maxDate={maxDate} className="w-full border-0" />
                        {errors.date && <p className="text-xs text-red-600 mt-1 px-1">{errors.date}</p>}
                    </Card>
                    {date && occupied.length > 0 && (
                        <Card title="Horarios ocupados">
                            <div className="space-y-2">
                                {occupied.map((o, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                                        <span>🔴 {o.startTime?.substring(0, 5)} - {o.endTime?.substring(0, 5)} ({o.eventName || 'Evento'})</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                    {date && (
                        <Card>
                            <div className="grid grid-cols-2 gap-4 mb-4">
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
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-amber-600 text-xl leading-none mt-0.5">⚠️</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-amber-800">Duración excede el límite permitido</p>
                                            <p className="text-xs text-amber-700 mt-1">La duración máxima por reserva es de 8 horas. Has seleccionado {calcDuration().toFixed(1)} horas. Para duraciones mayores, contacta directamente al administrador o dueño del local.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col gap-1 mb-4">
                                <label className="text-sm font-medium text-gray-700">Invitados</label>
                                <input type="number" value={totalPeople} onChange={e => { setTotalPeople(Number(e.target.value)); validate('totalPeople', Number(e.target.value)); }} min={1} max={selectedEvent.maxCapacity} className={`border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${errors.totalPeople ? 'border-red-400' : 'border-gray-300'}`} />
                                {errors.totalPeople && <span className="text-xs text-red-600">{errors.totalPeople}</span>}
                                {!errors.totalPeople && <span className="text-xs text-gray-400">Máximo {selectedEvent.maxCapacity} invitados</span>}
                            </div>
                            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => setStep(0)}>Atrás</Button>
                                <Button onClick={() => setStep(2)} disabled={eventoHasErrors}>
                                    Siguiente
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {step === 2 && selectedEvent && date && (
                <Card title="Confirmar Reserva" className="max-w-2xl">
                    <div className="space-y-3 text-sm text-gray-600">
                        <p><span className="font-medium">Evento:</span> {selectedEvent.name}</p>
                        <p><span className="font-medium">Fecha:</span> {date.toISOString().split('T')[0]}</p>
                        <p><span className="font-medium">Horario:</span> {startTime} - {endTime}</p>
                        <p><span className="font-medium">Duración:</span> {calcDuration().toFixed(1)} horas</p>
                        <p><span className="font-medium">Invitados:</span> {totalPeople}</p>
                        <p><span className="font-medium">Monto total:</span> <strong className="text-lg text-blue-600">S/ {(selectedEvent.pricePerDay && calcDuration() >= 8 ? selectedEvent.pricePerDay : selectedEvent.pricePerHour * calcDuration()).toFixed(2)}</strong></p>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Notas</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" />
                        </div>
                    </div>
                    {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mt-4">{error}</div>}
                    <div className="flex gap-2 mt-6">
                        <Button variant="secondary" onClick={() => setStep(1)}>Atrás</Button>
                        <Button onClick={handleSubmitEvento} disabled={loading || eventoHasErrors}>{loading ? 'Creando...' : 'Confirmar y Crear Reserva'}</Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
