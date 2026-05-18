import { useState, useEffect } from 'react';
import type { Event } from '../types/Event';
import { fetchEventsApi, fetchDeletedEventsApi, createEventApi, updateEventApi, deleteEventApi, restoreEventApi } from '../api/events.api';

export function useEvents() {
    const [events, setEvents] = useState<Event[]>([]);
    const [deleted, setDeleted] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [a, d] = await Promise.all([fetchEventsApi(), fetchDeletedEventsApi()]);
            setEvents(a);
            setDeleted(d);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const create = async (e: Partial<Event>) => { await createEventApi(e); await load(); };
    const update = async (id: string, e: Partial<Event>) => { await updateEventApi(id, e); await load(); };
    const remove = async (id: string) => { await deleteEventApi(id); await load(); };
    const restore = async (id: string) => { await restoreEventApi(id); await load(); };

    return { events, deleted, loading, create, update, remove, restore, reload: load };
}
