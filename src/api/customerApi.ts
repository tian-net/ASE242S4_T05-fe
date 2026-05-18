import api from './axios';
import type { Customer } from '../types/Customer';

export const fetchCustomersApi = async (): Promise<Customer[]> => {
    const { data } = await api.get<Customer[]>('/customers');
    return data;
};

export const fetchDeletedCustomersApi = async (): Promise<Customer[]> => {
    const { data } = await api.get<Customer[]>('/customers/deleted');
    return data;
};

export const fetchCustomerByIdApi = async (id: string): Promise<Customer> => {
    const { data } = await api.get<Customer>(`/customers/${id}`);
    return data;
};

export const createCustomerApi = async (customer: Customer): Promise<Customer> => {
    const { data } = await api.post<Customer>('/customers', customer);
    return data;
};

export const updateCustomerApi = async (id: string, customer: Partial<Customer>): Promise<Customer> => {
    const { data } = await api.put<Customer>(`/customers/${id}`, customer);
    return data;
};

export const deleteCustomerApi = async (id: string): Promise<void> => {
    await api.patch(`/customers/logical/${id}`);
};

export const restoreCustomerApi = async (id: string): Promise<void> => {
    await api.patch(`/customers/restore/${id}`);
};
