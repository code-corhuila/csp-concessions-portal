import { Injectable, inject, signal } from '@angular/core';
import { CatalogItem } from '../model/catalog-item';
import { Combo } from '../model/combo';
import { OrderItemType } from '../model/order';
import { Product } from '../model/product';
import { allPages, messageOf } from './api-calls';
import { ConcessionsApiService } from './concessions-api.service';

/**
 * What the client can order, as csp-concessions-api holds it. The API already hides what is not published from a
 * caller without the write permission; the filter here keeps that rule whatever the answer carries.
 */
@Injectable({ providedIn: 'root' })
export class SnackCatalogService {
  private readonly api = inject(ConcessionsApiService);
  private readonly loaded = signal<readonly CatalogItem[]>([]);

  readonly items = this.loaded.asReadonly();
  /** Why the last load failed; empty when it worked. */
  readonly loadError = signal('');

  /** Replaces the list with every published product and combo. A failure keeps the list and sets {@link loadError}. */
  async load(): Promise<void> {
    try {
      const [products, combos] = await Promise.all([
        allPages((page, limit) => this.api.listProducts(page, limit)),
        allPages((page, limit) => this.api.listCombos(page, limit)),
      ]);
      this.loaded.set(
        [...products.map(item => toCatalogItem(item, 'PRODUCT')), ...combos.map(item => toCatalogItem(item, 'COMBO'))]
          .filter(item => item.status === 'PUBLISHED'),
      );
      this.loadError.set('');
    } catch (err) {
      this.loadError.set(messageOf(err));
    }
  }
}

function toCatalogItem(item: Product | Combo, kind: OrderItemType): CatalogItem {
  return { id: item.id, kind, name: item.name, price: item.price, status: item.status };
}
