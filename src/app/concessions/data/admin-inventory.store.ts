import { Injectable, inject, signal } from '@angular/core';
import { StockAdjustment, StockMovement } from '../model/stock-movement';
import { AdminProductsStore } from './admin-products.store';

export interface NewAdjustment extends StockAdjustment {
  reason: string;
}

/** Stock adjustments of the administration area, in memory: each one is auditable and never leaves negative stock. */
@Injectable({ providedIn: 'root' })
export class AdminInventoryStore {
  private readonly products = inject(AdminProductsStore);
  private readonly items = signal<readonly StockMovement[]>([
    { id: 'm2', productId: '61000000-0000-0000-0000-000000000002', productName: 'Nachos with cheese', quantityDelta: 25, reason: 'Stock inicial', timestamp: '2026-10-01T09:05:00.000Z' },
    { id: 'm1', productId: '61000000-0000-0000-0000-000000000001', productName: 'Popcorn (large)', quantityDelta: 40, reason: 'Stock inicial', timestamp: '2026-10-01T09:00:00.000Z' },
  ]);

  /** Newest first. */
  readonly movements = this.items.asReadonly();

  adjust(adjustment: NewAdjustment): void {
    const product = this.products.products().find(p => p.id === adjustment.productId);
    const reason = adjustment.reason.trim();
    if (!product) {
      throw new Error('El producto no existe.');
    }
    if (!Number.isInteger(adjustment.quantityDelta) || adjustment.quantityDelta === 0) {
      throw new Error('La cantidad debe ser un entero distinto de cero.');
    }
    if (reason === '') {
      throw new Error('El motivo es obligatorio.');
    }
    if (product.stock + adjustment.quantityDelta < 0) {
      throw new Error('El ajuste dejaría el stock en negativo.');
    }
    this.products.setStock(product.id, product.stock + adjustment.quantityDelta, reason);
    this.items.update(current => [
      {
        id: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        quantityDelta: adjustment.quantityDelta,
        reason,
        timestamp: new Date().toISOString(),
      },
      ...current,
    ]);
  }
}
