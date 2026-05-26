export interface User {
    id?: string;
    fullName: string;
    email: string;
    password?: string;
    role: 'admin' | 'cliente';
    customerId?: string;
    isDeleted?: boolean;
}
