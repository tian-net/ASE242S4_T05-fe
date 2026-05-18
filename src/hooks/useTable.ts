import { useState, useEffect } from 'react';
import type { RestaurantTable } from '../types/RestaurantTable';
import { fetchTablesApi, fetchDeletedTablesApi, createTableApi, updateTableApi, deleteTableApi, restoreTableApi } from '../api/tables.api';

export function useTables() {
    const [tables, setTables] = useState<RestaurantTable[]>([]);
    const [deleted, setDeleted] = useState<RestaurantTable[]>([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [a, d] = await Promise.all([fetchTablesApi(), fetchDeletedTablesApi()]);
            setTables(a);
            setDeleted(d);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const create = async (t: Partial<RestaurantTable>) => { await createTableApi(t); await load(); };
    const update = async (id: string, t: Partial<RestaurantTable>) => { await updateTableApi(id, t); await load(); };
    const remove = async (id: string) => { await deleteTableApi(id); await load(); };
    const restore = async (id: string) => { await restoreTableApi(id); await load(); };

    return { tables, deleted, loading, create, update, remove, restore, reload: load };
}
