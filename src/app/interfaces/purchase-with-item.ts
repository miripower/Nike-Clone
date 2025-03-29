import { Purchase } from './purchase';
import { PurchaseItem } from './purchase-item';
export interface PurchaseWithItems extends Purchase {
    items: PurchaseItem[];
}