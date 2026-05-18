import api from './axios';
import type { AuthResponse } from '../types/AuthResponse';
import type { User } from '../types/User';

export const loginApi = async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/users/login', { email, password });
    return data;
};

export const registerApi = async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    docType: string;
    docNum: string;
}): Promise<User> => {
    const { data } = await api.post<User>('/users/register', payload);
    return data;
};

export const fetchUsersApi = async (): Promise<User[]> => {
    const { data } = await api.get<User[]>('/users');
    return data;
};

export const fetchDeletedUsersApi = async (): Promise<User[]> => {
    const { data } = await api.get<User[]>('/users/deleted');
    return data;
};

export const fetchUserByIdApi = async (id: string): Promise<User> => {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
};

export const createUserApi = async (user: Partial<User>): Promise<User> => {
    const { data } = await api.post<User>('/users', user);
    return data;
};

export const updateUserApi = async (id: string, user: Partial<User>): Promise<User> => {
    const { data } = await api.put<User>(`/users/${id}`, user);
    return data;
};

export const deleteUserApi = async (id: string): Promise<void> => {
    await api.patch(`/users/logical/${id}`);
};

export const restoreUserApi = async (id: string): Promise<void> => {
    await api.patch(`/users/restore/${id}`);
};
