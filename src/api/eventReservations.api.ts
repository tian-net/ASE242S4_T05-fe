import api from './axios';
import type { EventReservation } from '../types/EventReservation';

export const fetchEventReservationsApi = async (): Promise<EventReservation[]> => {
    const { data } = await api.get<EventReservation[]>('/event-reservations');
    return data;
};

export const fetchDeletedEventReservationsApi = async (): Promise<EventReservation[]> => {
    const { data } = await api.get<EventReservation[]>('/event-reservations/deleted');
    return data;
};

export const fetchMyEventReservationsApi = async (customerId: string): Promise<EventReservation[]> => {
    const { data } = await api.get<EventReservation[]>(`/event-reservations/customer/${customerId}`);
    return data;
};

export const fetchEventReservationByIdApi = async (id: string): Promise<EventReservation> => {
    const { data } = await api.get<EventReservation>(`/event-reservations/${id}`);
    return data;
};

export const fetchOccupiedTimesApi = async (date: string): Promise<EventReservation[]> => {
    const { data } = await api.get<EventReservation[]>(`/event-reservations/by-date/${date}`);
    return data;
};

export const createEventReservationApi = async (reservation: Partial<EventReservation>): Promise<EventReservation> => {
    const { data } = await api.post<EventReservation>('/event-reservations', reservation);
    return data;
};

export const updateEventReservationApi = async (id: string, reservation: Partial<EventReservation>): Promise<EventReservation> => {
    const { data } = await api.put<EventReservation>(`/event-reservations/${id}`, reservation);
    return data;
};

export const checkEventAvailabilityApi = async (params: {
    eventDate: string;
    startTime?: string;
    endTime?: string;
    reservationType: string;
    excludeId?: string;
}): Promise<{ available: boolean; conflicts: Array<{ message: string }> }> => {
    const { data } = await api.get('/event-reservations/check-availability', { params });
    return data;
};

export const cancelEventReservationApi = async (id: string): Promise<void> => {
    await api.patch(`/event-reservations/logical/${id}`);
};

export const restoreEventReservationApi = async (id: string): Promise<void> => {
    await api.patch(`/event-reservations/restore/${id}`);
};
