import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { StockAdjustment, StockMovement } from '../model/stock-movement';
import { AdminProductsStore } from './admin-products.store';
import { allPages, messageOf } from './api-calls';
import { ConcessionsApiService } from './concessions-api.service';

/**
 * Stock of the administration area, as csp-concessions-api holds it (HU-CONCESSIONS-003 and 007): an adjustment is
 * sent to the API, which records the movement and keeps the balance from going negative; the balances and the
 * history shown are read back afterwards.
 */
@Injectable({ providedIn: 'root' })
export class AdminInventoryStore {
  private readonly api = inject(ConcessionsApiService);
  private readonly products = inject(AdminProductsStore);
  private readonly items = signal<readonly StockMovement[]>([]);

  /** Newest first, as the API answers them. */
  readonly movements = this.items.asReadonly();
  /** Why the last load failed; empty when it worked. */
  readonly loadError = signal('');

  /** Reads the balances and the whole history. A failure keeps what was shown and sets {@link loadError}. */
  async load(): Promise<void> {
    await this.products.load();
    try {
      this.items.set(await allPages((page, limit) => this.api.listStockMovements(page, limit)));
      this.loadError.set(this.products.loadError());
    } catch (err) {
      this.loadError.set(messageOf(err));
    }
  }

  /** A positive quantity is a receipt and a negative one a withdrawal; a zero or fractional one is not an adjustment. */
  async adjust(adjustment: StockAdjustment): Promise<void> {
    const product = this.products.products().find(p => p.id === adjustment.productId);
    if (!product) {
      throw new Error('El producto no existe.');
    }
    if (!Number.isInteger(adjustment.quantityDelta) || adjustment.quantityDelta === 0) {
      throw new Error('La cantidad debe ser un entero distinto de cero.');
    }
    if (product.stock + adjustment.quantityDelta < 0) {
      throw new Error('El ajuste dejaría el stock en negativo.');
    }
    try {
      await firstValueFrom(this.api.adjustStock(adjustment, crypto.randomUUID()));
    } catch (err) {
      throw new Error(messageOf(err));
    }
    await this.load();
  }
}
