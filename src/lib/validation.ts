export const required = (v: string | undefined | null, label: string): string | null => {
    if (!v || !v.trim()) return `${label} es requerido`;
    return null;
};

export const email = (v: string): string | null => {
    if (!v) return 'Email es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Email inválido';
    return null;
};

export const minLength = (min: number) => (v: string, label: string): string | null => {
    if (v && v.length < min) return `${label} debe tener al menos ${min} caracteres`;
    return null;
};

export const lettersOnly = (v: string, label: string): string | null => {
    if (!v) return null;
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(v)) return `${label} solo acepta letras`;
    return null;
};

export const digitsOnly = (v: string, label: string): string | null => {
    if (!v) return null;
    if (!/^\d+$/.test(v)) return `${label} solo acepta dígitos`;
    return null;
};

export const phone = (v: string): string | null => {
    if (!v) return 'Teléfono es requerido';
    if (!/^9\d{8}$/.test(v)) return 'Teléfono debe ser 9 dígitos empezando con 9';
    return null;
};

export const docNum = (type: string, num: string): string | null => {
    if (!num) return 'N° documento es requerido';
    switch (type) {
        case 'DNI': return /^\d{8}$/.test(num) ? null : 'DNI debe tener 8 dígitos';
        case 'RUC': return /^\d{11}$/.test(num) ? null : 'RUC debe tener 11 dígitos';
        case 'CarnetExtranjeria':
        case 'Pasaporte':
            return num.length >= 5 && num.length <= 12 ? null : `${type} debe tener entre 5 y 12 caracteres`;
        default: return 'Tipo de documento inválido';
    }
};

export const positiveNumber = (n: number | undefined | null, label: string): string | null => {
    if (n === undefined || n === null || n <= 0) return `${label} debe ser mayor a 0`;
    return null;
};

export const nonNegative = (n: number | undefined | null, label: string): string | null => {
    if (n === undefined || n === null || n < 0) return `${label} no puede ser negativo`;
    return null;
};

export const isValidJson = (v: string): string | null => {
    if (!v) return null;
    try { JSON.parse(v); return null; }
    catch { return 'Formato JSON inválido'; }
};

export const timeAfter = (start: string, end: string): string | null => {
    if (!start || !end) return null;
    return start < end ? null : 'Hora fin debe ser después de hora inicio';
};

export const futureDate = (dateStr: string, minDays: number = 1): string | null => {
    if (!dateStr) return 'Fecha es requerida';
    const date = new Date(dateStr);
    const min = new Date();
    min.setDate(min.getDate() + minDays);
    min.setHours(0, 0, 0, 0);
    if (date < min) return `Fecha debe ser al menos ${minDays} día(s) a partir de hoy`;
    return null;
};

export const maxDate = (dateStr: string, maxDays: number): string | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const max = new Date();
    max.setDate(max.getDate() + maxDays);
    max.setHours(23, 59, 59, 999);
    if (date > max) return `Fecha no puede exceder ${maxDays} días`;
    return null;
};

export const minDuration = (start: string, end: string, minHours: number, eventName: string): string | null => {
    if (!start || !end) return null;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const hours = (eh + em / 60) - (sh + sm / 60);
    if (hours < minHours) return `Duración mínima para ${eventName} es ${minHours} hora(s)`;
    return null;
};
