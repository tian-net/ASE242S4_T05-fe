export interface RestaurantTable {
    id?: string;
    tableNum: number;
    capacity: number;
    location: string;
    description?: string;
    status?: string;
    isReservable?: boolean;
    isDeleted?: boolean;
}
