import { MoneyInCents } from './money';

export type OrderItemType = 'PRODUCT' | 'COMBO';
export type OrderStatus = 'PENDING' | 'RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'READY' | 'DELIVERED';

export interface OrderItemRequest {
  itemId: string;
  itemType: OrderItemType;
  quantity: number;
}

export interface OrderRequest {
  reservationId?: string;
  items: OrderItemRequest[];
}

export interface Order extends OrderRequest {
  id: string;
  status: OrderStatus;
  totalAmount: MoneyInCents;
}
