import { PurchaseItem } from "./purchase-item";

export interface Purchase {
    id: number;
    userId: number;
    total_price: number;
    created_at: string;
    items: PurchaseItem[];
}