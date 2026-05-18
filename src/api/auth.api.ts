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
