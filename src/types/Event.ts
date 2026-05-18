export interface Event {
    id?: string;
    name: string;
    eventType: string;
    description?: string;
    maxCapacity: number;
    pricePerHour: number;
    pricePerDay?: number;
    isActive: boolean;
    isDeleted?: boolean;
}
