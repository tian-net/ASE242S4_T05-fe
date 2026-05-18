import api from './axios';
import type { Reservation } from '../types/Reservation';

export const fetchReservationsApi = async (): Promise<Reservation[]> => {
    const { data } = await api.get<Reservation[]>('/reservations');
    return data;
};

export const fetchReservationByIdApi = async (id: string): Promise<Reservation> => {
    const { data } = await api.get<Reservation>(`/reservations/${id}`);
    return data;
};

export const createReservationApi = async (reservation: Partial<Reservation>): Promise<Reservation> => {
    const { data } = await api.post<Reservation>('/reservations', reservation);
    return data;
};

export const updateReservationApi = async (id: string, reservation: Partial<Reservation>): Promise<Reservation> => {
    const { data } = await api.put<Reservation>(`/reservations/${id}`, reservation);
    return data;
};

export const cancelReservationApi = async (id: string): Promise<void> => {
    await api.patch(`/reservations/logical/${id}`);
};

export const restoreReservationApi = async (id: string): Promise<void> => {
    await api.patch(`/reservations/restore/${id}`);
};
