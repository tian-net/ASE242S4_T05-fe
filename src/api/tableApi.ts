import api from './axios';
import type { RestaurantTable } from '../types/RestaurantTable';

export const fetchTablesApi = async (): Promise<RestaurantTable[]> => {
    const { data } = await api.get<RestaurantTable[]>('/tables');
    return data;
};

export const fetchReservableTablesApi = async (): Promise<RestaurantTable[]> => {
    const { data } = await api.get<RestaurantTable[]>('/tables/reservable');
    return data;
};

export const fetchAvailableTablesApi = async (): Promise<RestaurantTable[]> => {
    const { data } = await api.get<RestaurantTable[]>('/tables/available');
    return data;
};

export const fetchDeletedTablesApi = async (): Promise<RestaurantTable[]> => {
    const { data } = await api.get<RestaurantTable[]>('/tables/deleted');
    return data;
};

export const fetchTableByIdApi = async (id: string): Promise<RestaurantTable> => {
    const { data } = await api.get<RestaurantTable>(`/tables/${id}`);
    return data;
};

export const createTableApi = async (table: Partial<RestaurantTable>): Promise<RestaurantTable> => {
    const { data } = await api.post<RestaurantTable>('/tables', table);
    return data;
};

export const updateTableApi = async (id: string, table: Partial<RestaurantTable>): Promise<RestaurantTable> => {
    const { data } = await api.put<RestaurantTable>(`/tables/${id}`, table);
    return data;
};

export const deleteTableApi = async (id: string): Promise<void> => {
    await api.patch(`/tables/logical/${id}`);
};

export const restoreTableApi = async (id: string): Promise<void> => {
    await api.patch(`/tables/restore/${id}`);
};

export const deleteTablePhysicalApi = async (id: string): Promise<void> => {
    await api.delete(`/tables/physical/${id}`);
};
