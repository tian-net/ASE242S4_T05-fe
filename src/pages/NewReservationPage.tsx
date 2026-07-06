import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { fetchActiveEnabledEventsApi } from '../api/events.api';
import { fetchReservableTablesApi } from '../api/tables.api';
import { createReservationApi } from '../api/reservations.api';
import { checkEventAvailabilityApi, createEventReservationApi } from '../api/eventReservations.api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Stepper } from '../components/ui/Stepper';
import { MINIMUM_HOURS } from '../lib/constants';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface DetailForm {
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
    totalPeople: number;
    notes: string;
    conflictMsg: string;
}

export default function NewReservationPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [resType, setResType] = useState<'evento' | 'mesa' | null>(null);
    const [step, setStep] = useState(0);
    const [events, setEvents] = useState<any[]>([]);
    const [details, setDetails] = useState<DetailForm[]>([]);
    const [nextId, setNextId] = useState(0);
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [tables, setTables] = useState<any[]>([]);
    const [date, setDate] = useState<Date | null>(null);
    const [startTime] = useState('18:00');

    useEffect(() => {
        fetchActiveEnabledEventsApi().then(setEvents).catch(() => {});
        fetchReservableTablesApi().then(setTables).catch(() => {});
    }, []);

    const addDetail = (event?: any) => {
        const ev = event || details[details.length - 1] || { pricePerHour: 0, pricePerDay: 0 };
        setDetails([...details, {
            id: nextId,
            eventId: event?.id || '',
            eventName: event?.name || '',
            eventDate: null,
            startTime: '18:00',
            endTime: '22:00',
            reservationType: 'hora',
            quantityHours: 4,
            pricePerHour: ev.pricePerHour || 0,
            pricePerDay: ev.pricePerDay || 0,
            totalPeople: 20,
            notes: '',
            conflictMsg: '',
        }]);
        setNextId(nextId + 1);
    };

    const removeDetail = (id: number) => {
        setDetails(details.filter(d => d.id !== id));
    };

    const checkConflict = async (d: DetailForm) => {
        if (!d.eventDate || !d.startTime || !d.endTime) return;
        const dateStr = d.eventDate.toISOString().split('T')[0];
        try {
            const res = await checkEventAvailabilityApi({
                eventDate: dateStr,
                startTime: d.startTime + ':00',
                endTime: d.endTime + ':00',
                reservationType: d.reservationType,
            });
            setDetails(prev => prev.map(pd => pd.id === d.id ? { ...pd, conflictMsg: res.available ? '' : (res.conflicts[0]?.message || 'Conflicto de horario') } : pd));
        } catch {
            setDetails(prev => prev.map(pd => pd.id === d.id ? { ...pd, conflictMsg: '' } : pd));
        }
    };

    let conflictTimer: ReturnType<typeof setTimeout>;
    const updateDetail = (id: number, field: string, value: any) => {
        setDetails(details.map(d => {
            if (d.id !== id) return d;
            const updated = { ...d, [field]: value };
            if (field === 'eventId') {
                const ev = events.find(e => e.id === value);
                if (ev) {
                    updated.eventName = ev.name;
                    updated.pricePerHour = ev.pricePerHour;
                    updated.pricePerDay = ev.pricePerDay || 0;
                }
            }
            if (field === 'startTime' || field === 'endTime' || field === 'eventId') {
                const [sh, sm] = updated.startTime.split(':').map(Number);
                const [eh, em] = updated.endTime.split(':').map(Number);
                const hours = (eh + em / 60) - (sh + sm / 60);
                updated.quantityHours = Math.ceil(hours);
                if (updated.pricePerDay && hours >= 8) {
                    updated.reservationType = 'dia';
                } else {
                    updated.reservationType = 'hora';
                }
            }
            if (field === 'eventDate' || field === 'startTime' || field === 'endTime') {
                clearTimeout(conflictTimer);
                conflictTimer = setTimeout(() => checkConflict(updated), 500);
            }
            return updated;
        }));
    };

    const calcTotalHours = () => details.reduce((sum, d) => sum + d.quantityHours, 0);

    const calcTotalAmount = () => details.reduce((sum, d) => {
        if (d.reservationType === 'dia') return sum + (d.pricePerDay || 0);
        return sum + (d.quantityHours * d.pricePerHour);
    }, 0);

    const validateDetail = (d: DetailForm): string[] => {
        const errs: string[] = [];
        if (!d.eventId) errs.push('Selecciona un evento');
        if (!d.eventDate) errs.push('Selecciona una fecha');
        if (!d.startTime || !d.endTime) errs.push('Define horario');
        if (d.startTime >= d.endTime) errs.push('Hora fin debe ser mayor a inicio');
        const minHrs = d.eventId ? (MINIMUM_HOURS[events.find(e => e.id === d.eventId)?.eventType] || 1) : 1;
        if (d.quantityHours < minHrs) errs.push(`Mínimo ${minHrs}h`);
        if (d.quantityHours > 8) errs.push('Máximo 8h');
        if (!d.totalPeople || d.totalPeople < 1) errs.push('Indica el número de invitados');
        if (d.conflictMsg) errs.push(d.conflictMsg);
        return errs;
    };

    const allDetailsValid = () => details.length > 0 && details.every(d => validateDetail(d).length === 0);

    const handleSubmitEvento = async () => {
        if (!user?.customer?.id || !allDetailsValid()) return;
        setError('');
        setLoading(true);
        try {
            await createEventReservationApi({
                customerId: user.customer.id,
                details: details.map(d => {
                    const dateStr = d.eventDate ? d.eventDate.toISOString().split('T')[0] : '';
                    const hours = d.quantityHours;
                    const isFullDay = d.pricePerDay && hours >= 8;
                    return {
                        eventId: d.eventId,
                        eventDate: dateStr,
                        startTime: d.startTime + ':00',
                        endTime: d.endTime + ':00',
                        reservationType: isFullDay ? 'dia' : 'hora',
                        quantityHours: hours,
                        totalPeople: d.totalPeople,
                        notes: d.notes,
                    };
                }),
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
            const dateStr = date!.toISOString().split('T')[0];
            await createReservationApi({
                customerId: user.customer.id,
                resDate: dateStr,
                resTime: startTime + ':00',
                numPeople: 1,
                details: selectedTables.map(id => ({ tableId: id, notes: '' })),
            });
            navigate('/cliente/my-reservations', { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Error al crear reserva de mesa');
        } finally { setLoading(false); }
    };

    const validate = (field: string, value: any) => {
        const newErrors = { ...errors };
        switch (field) {
            case 'date':
                newErrors.date = date ? '' : 'Selecciona una fecha';
                break;
            case 'selectedTables':
                newErrors.selectedTables = value.length === 0 ? 'Selecciona al menos una mesa' : '';
                break;
        }
        setErrors(newErrors);
    };

    const mesaHasErrors = Object.values(errors).some(Boolean) || !date || selectedTables.length === 0;

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
                    </Card>
                    {date && (
                        <Card>
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
                <Button variant="ghost" onClick={() => { setResType(null); setStep(0); setDetails([]); }}>← Volver</Button>
                <h2 className="text-2xl font-bold text-gray-900">Nueva Reserva de Evento</h2>
            </div>
            <Stepper steps={['Eventos', 'Confirmar']} currentStep={step} />

            {step === 0 && (
                <div className="space-y-6">
                    {details.map((d, idx) => {
                        const detailErrors = validateDetail(d);
                        return (
                            <Card key={d.id} title={`Evento ${idx + 1}`}>
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <label className="text-sm font-medium text-gray-700">Selecciona evento</label>
                                            <select value={d.eventId} onChange={e => updateDetail(d.id, 'eventId', e.target.value)}
                                                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 mt-1">
                                                <option value="">Seleccionar evento</option>
                                                {events.map((e: any) => (
                                                    <option key={e.id} value={e.id}>{e.name} - S/ {e.pricePerHour}/hora</option>
                                                ))}
                                            </select>
                                        </div>
                                        {details.length > 1 && (
                                            <Button variant="ghost" onClick={() => removeDetail(d.id)} className="text-red-500 mt-6">✕</Button>
                                        )}
                                    </div>
                                    {d.eventId && (
                                        <>
                                            <div>
                                                <Calendar
                                                    onChange={(v) => updateDetail(d.id, 'eventDate', v as Date)}
                                                    value={d.eventDate}
                                                    minDate={tomorrow}
                                                    maxDate={maxDate}
                                                    className="w-full border-0"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-sm font-medium text-gray-700">Hora inicio</label>
                                                    <input type="time" value={d.startTime} onChange={e => updateDetail(d.id, 'startTime', e.target.value)}
                                                        className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-sm font-medium text-gray-700">Hora fin</label>
                                                    <input type="time" value={d.endTime} onChange={e => updateDetail(d.id, 'endTime', e.target.value)}
                                                        className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-sm font-medium text-gray-700">Invitados</label>
                                                    <input type="number" value={d.totalPeople} onChange={e => updateDetail(d.id, 'totalPeople', Number(e.target.value))} min={1}
                                                        className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-sm font-medium text-gray-700">Notas (opcional)</label>
                                                    <input value={d.notes} onChange={e => updateDetail(d.id, 'notes', e.target.value)}
                                                        className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" />
                                                </div>
                                            </div>
                                            {d.eventDate && (
                                                <p className="text-xs text-gray-500">
                                                    Duración: {d.quantityHours}h | Tipo: {d.reservationType === 'dia' ? 'Día completo' : 'Por hora'}
                                                    {d.pricePerDay && d.quantityHours >= 8 && ' (aplica tarifa día)'}
                                                </p>
                                            )}
                                            {d.conflictMsg && (
                                                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-2 rounded">
                                                    ⚠️ {d.conflictMsg}
                                                </div>
                                            )}
                                            {detailErrors.filter(e => e !== d.conflictMsg).length > 0 && (
                                                <div className="bg-red-50 text-red-600 text-xs p-2 rounded space-y-1">
                                                    {detailErrors.filter(e => e !== d.conflictMsg).map((e, i) => <p key={i}>{e}</p>)}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                    <Button variant="secondary" onClick={() => addDetail()} disabled={details.length > 0 && !details[details.length-1].eventId}>
                        + Agregar otro evento
                    </Button>
                    <div className="flex gap-2 mt-4">
                        <Button onClick={() => setStep(1)} disabled={!allDetailsValid()}>
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}

            {step === 1 && (
                <Card title="Confirmar Reserva de Evento" className="max-w-2xl">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800">Eventos seleccionados:</h3>
                        {details.map((d, idx) => (
                            <div key={d.id} className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">Evento {idx + 1}:</span> {d.eventName}</p>
                                <p><span className="font-medium">Fecha:</span> {d.eventDate?.toISOString().split('T')[0]} | <span className="font-medium">Horario:</span> {d.startTime} - {d.endTime} ({d.quantityHours}h)</p>
                                <p><span className="font-medium">Invitados:</span> {d.totalPeople}</p>
                                {d.notes && <p><span className="font-medium">Notas:</span> {d.notes}</p>}
                                <p><span className="font-medium">Subtotal:</span> S/ {(d.reservationType === 'dia' ? (d.pricePerDay || 0) : d.quantityHours * d.pricePerHour).toFixed(2)}</p>
                            </div>
                        ))}
                        <div className="border-t pt-3">
                            <p><span className="font-medium">Total personas:</span> {details.reduce((s, d) => s + d.totalPeople, 0)}</p>
                            <p><span className="font-medium">Total horas:</span> {calcTotalHours()}h</p>
                            <p><span className="font-medium text-lg text-blue-600">Total: S/ {calcTotalAmount().toFixed(2)}</span></p>
                        </div>
                        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => setStep(0)}>Atrás</Button>
                            <Button onClick={handleSubmitEvento} disabled={loading}>
                                {loading ? 'Creando...' : 'Confirmar y Crear Reserva'}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
