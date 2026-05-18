import api from './axios';
import type { Event } from '../types/Event';

export const fetchEventsApi = async (): Promise<Event[]> => {
    const { data } = await api.get<Event[]>('/events');
    return data;
};

export const fetchActiveEnabledEventsApi = async (): Promise<Event[]> => {
    const { data } = await api.get<Event[]>('/events/active-enabled');
    return data;
};

export const fetchDeletedEventsApi = async (): Promise<Event[]> => {
    const { data } = await api.get<Event[]>('/events/deleted');
    return data;
};

export const fetchEventByIdApi = async (id: string): Promise<Event> => {
    const { data } = await api.get<Event>(`/events/${id}`);
    return data;
};

export const createEventApi = async (event: Partial<Event>): Promise<Event> => {
    const { data } = await api.post<Event>('/events', event);
    return data;
};

export const updateEventApi = async (id: string, event: Partial<Event>): Promise<Event> => {
    const { data } = await api.put<Event>(`/events/${id}`, event);
    return data;
};

export const deleteEventApi = async (id: string): Promise<void> => {
    await api.patch(`/events/logical/${id}`);
};

export const restoreEventApi = async (id: string): Promise<void> => {
    await api.patch(`/events/restore/${id}`);
};
