export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8087/api';

export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'auth_user';

export const STATUS_COLORS: Record<string, string> = {
    Planificado: 'bg-blue-100 text-blue-800',
    pendiente: 'bg-yellow-100 text-yellow-800',
    Confirmado: 'bg-green-100 text-green-800',
    Cancelado: 'bg-red-100 text-red-800',
    cancelada: 'bg-red-100 text-red-800',
    'En curso': 'bg-purple-100 text-purple-800',
    Finalizado: 'bg-gray-100 text-gray-800',
};

export const MINIMUM_HOURS: Record<string, number> = {
    FULL_DAY: 8,
    ALQUILER_POR_HORA: 1,
    CUMPLEANOS: 2,
    BODA: 4,
    MATRIMONIO: 4,
    BABY_SHOWER: 2,
    DESPEDIDA: 2,
    GRADO: 2,
    GARANTIA: 1,
    CONFERENCIA: 1,
};
