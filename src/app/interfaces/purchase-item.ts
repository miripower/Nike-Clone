import { Product } from './product';

export interface PurchaseItem {
    id: number;
    shopping_id: number;
    product_id: number;
    quantity: number;
    price: number;
    product?: Product;
}