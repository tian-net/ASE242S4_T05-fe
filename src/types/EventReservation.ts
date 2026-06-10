export interface EventDetail {
    eventId: string;
    eventName?: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    reservationType: string;
    quantityHours?: number;
    pricePerHour?: number;
    pricePerDay?: number;
    totalAmount?: number;
    totalPeople: number;
    notes?: string;
}

export interface EventReservation {
    id?: string;
    customerId: string;
    totalPeople: number;
    venueCapacity?: number;
    status: string;
    details: EventDetail[];
    totalAmount?: number;
    isDeleted?: boolean;
}

export interface CheckAvailabilityRequest {
    eventDate: string;
    startTime?: string;
    endTime?: string;
    reservationType: string;
    excludeId?: string;
}

export interface CheckAvailabilityResponse {
    available: boolean;
    conflicts: Array<{ message: string }>;
}
