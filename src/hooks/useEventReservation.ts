import { useState, useEffect } from 'react';
import type { EventReservation } from '../types/EventReservation';
import { fetchEventReservationsApi, fetchDeletedEventReservationsApi, fetchMyEventReservationsApi, createEventReservationApi, updateEventReservationApi, cancelEventReservationApi, restoreEventReservationApi, fetchOccupiedTimesApi } from '../api/eventReservations.api';

export function useEventReservations(customerId?: string) {
    const [reservations, setReservations] = useState<EventReservation[]>([]);
    const [deleted, setDeleted] = useState<EventReservation[]>([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            if (customerId) {
                const data = await fetchMyEventReservationsApi(customerId);
                setReservations(data);
            } else {
                const [a, d] = await Promise.all([fetchEventReservationsApi(), fetchDeletedEventReservationsApi()]);
                setReservations(a);
                setDeleted(d);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [customerId]);

    const create = async (r: Partial<EventReservation>) => { await createEventReservationApi(r); await load(); };
    const update = async (id: string, r: Partial<EventReservation>) => { await updateEventReservationApi(id, r); await load(); };
    const cancel = async (id: string) => { await cancelEventReservationApi(id); await load(); };
    const restore = async (id: string) => { await restoreEventReservationApi(id); await load(); };
    const getOccupied = async (date: string) => fetchOccupiedTimesApi(date);

    return { reservations, deleted, loading, create, update, cancel, restore, getOccupied, reload: load };
}
