export interface Customer {
    id?: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    docType: 'DNI' | 'RUC' | 'CarnetExtranjeria' | 'Pasaporte';
    docNum: string;
    isFrequent: boolean;
    isDeleted?: boolean;
}
