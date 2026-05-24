import { useState, useEffect } from 'react';
import type { Customer } from '../types/Customer';
import { fetchCustomersApi, fetchDeletedCustomersApi, createCustomerApi, updateCustomerApi, deleteCustomerApi, restoreCustomerApi } from '../api/customers.api';

export function useCustomers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [deleted, setDeleted] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [a, d] = await Promise.all([fetchCustomersApi(), fetchDeletedCustomersApi()]);
            setCustomers(a);
            setDeleted(d);
        } catch {
            setCustomers([]);
            setDeleted([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const create = async (c: Customer) => { await createCustomerApi(c); await load(); };
    const update = async (id: string, c: Partial<Customer>) => { await updateCustomerApi(id, c); await load(); };
    const remove = async (id: string) => { await deleteCustomerApi(id); await load(); };
    const restore = async (id: string) => { await restoreCustomerApi(id); await load(); };

    return { customers, deleted, loading, create, update, remove, restore, reload: load };
}
