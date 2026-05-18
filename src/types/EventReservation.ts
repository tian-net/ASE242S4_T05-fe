export interface EventReservation {
    id?: string;
    customerId: string;
    eventId: string;
    eventName?: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    reservationType: string;
    quantityHours?: number;
    pricePerHour?: number;
    pricePerDay?: number;
    totalAmount: number;
    totalPeople: number;
    venueCapacity?: number;
    status: string;
    notes?: string;
    isDeleted?: boolean;
}
