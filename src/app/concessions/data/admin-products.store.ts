import { Injectable, signal } from '@angular/core';
import { AdminProduct, NewProduct } from '../model/admin-product';
import { moneyInCents } from '../model/money';
import { ProductStatus } from '../model/product';
import { SYNTHETIC_ADMIN_PRODUCTS } from './synthetic-admin-products';

/** The products of the administration area, kept in memory: a page reload restores the synthetic ones. */
@Injectable({ providedIn: 'root' })
export class AdminProductsStore {
  private readonly items = signal<readonly AdminProduct[]>(SYNTHETIC_ADMIN_PRODUCTS);

  readonly products = this.items.asReadonly();

  /** A new product is a draft with no stock: it is published when it is ready. */
  create(product: NewProduct): void {
    const name = product.name.trim();
    if (name === '') {
      throw new Error('El nombre es obligatorio.');
    }
    if (!Number.isInteger(product.price) || product.price < 0) {
      throw new Error('El precio debe ser un monto no negativo.');
    }
    this.items.update(current => [
      ...current,
      { id: crypto.randomUUID(), name, category: product.category.trim(), price: moneyInCents(product.price), stock: 0, status: 'DRAFT', lastReason: 'Product created' },
    ]);
  }

  publish(id: string): void {
    this.setStatus(id, 'PUBLISHED');
  }

  deactivate(id: string): void {
    this.setStatus(id, 'INACTIVE');
  }

  /** Used by the inventory: the new stock and the reason of the last movement. */
  setStock(id: string, stock: number, reason: string): void {
    this.items.update(current => current.map(p => (p.id === id ? { ...p, stock, lastReason: reason } : p)));
  }

  private setStatus(id: string, status: ProductStatus): void {
    this.items.update(current => current.map(p => (p.id === id ? { ...p, status } : p)));
  }
}
