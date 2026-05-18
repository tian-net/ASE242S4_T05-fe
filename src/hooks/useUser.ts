import { useState, useEffect } from 'react';
import type { User } from '../types/User';
import { fetchUsersApi, fetchDeletedUsersApi, createUserApi, updateUserApi, deleteUserApi, restoreUserApi } from '../api/users.api';

export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [deleted, setDeleted] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [a, d] = await Promise.all([fetchUsersApi(), fetchDeletedUsersApi()]);
            setUsers(a);
            setDeleted(d);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const create = async (u: Partial<User>) => { await createUserApi(u); await load(); };
    const update = async (id: string, u: Partial<User>) => { await updateUserApi(id, u); await load(); };
    const remove = async (id: string) => { await deleteUserApi(id); await load(); };
    const restore = async (id: string) => { await restoreUserApi(id); await load(); };

    return { users, deleted, loading, create, update, remove, restore, reload: load };
}
