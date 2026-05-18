export interface ReservationDetail {
    tableId: string;
    notes?: string;
}

export interface Reservation {
    id?: string;
    customerId: string;
    resDate: string;
    resTime: string;
    numPeople: number;
    status?: string;
    totalAmt?: number;
    details?: ReservationDetail[];
    isDeleted?: boolean;
}
