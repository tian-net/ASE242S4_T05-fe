export interface AuthResponse {
    token: string;
    id: string;
    fullName: string;
    email: string;
    role: 'admin' | 'cliente';
    customer: any;
}
