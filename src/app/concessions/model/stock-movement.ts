export interface StockAdjustment {
  productId: string;
  quantityDelta: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  quantityDelta: number;
  reason: string;
  timestamp: string;
}
