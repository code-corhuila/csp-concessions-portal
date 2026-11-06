import { Injectable, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { AdminProduct, NewProduct } from '../model/admin-product';
import { moneyInCents } from '../model/money';
import { Product, ProductStatus } from '../model/product';
import { allPages, messageOf } from './api-calls';
import { ConcessionsApiService } from './concessions-api.service';

/**
 * The products of the administration area, as csp-concessions-api holds them. The stock shown is the one the
 * API reports; the inventory screen reads it again after each adjustment.
 */
@Injectable({ providedIn: 'root' })
export class AdminProductsStore {
  private readonly api = inject(ConcessionsApiService);
  private readonly items = signal<readonly AdminProduct[]>([]);

  readonly products = this.items.asReadonly();
  /** Why the last load failed; empty when it worked. */
  readonly loadError = signal('');

  /** Replaces the list with every page of the API. A failure keeps the list and sets {@link loadError}. */
  async load(): Promise<void> {
    try {
      const loaded = await allPages((page, limit) => this.api.listProducts(page, limit));
      this.items.set(loaded.map(toAdminProduct));
      this.loadError.set('');
    } catch (err) {
      this.loadError.set(messageOf(err));
    }
  }

  /** A new product is a draft with no stock: it is published when it is ready. */
  async create(product: NewProduct): Promise<void> {
    const name = product.name.trim();
    if (name === '') {
      throw new Error('El nombre es obligatorio.');
    }
    if (!Number.isInteger(product.price) || product.price < 0) {
      throw new Error('El precio debe ser un monto no negativo.');
    }
    const body = { name, category: product.category.trim(), price: moneyInCents(product.price) };
    const created = await this.answered(this.api.createProduct(body, crypto.randomUUID()));
    this.items.update(current => [...current, toAdminProduct(created)]);
  }

  publish(id: string): Promise<void> {
    return this.setStatus(id, 'PUBLISHED');
  }

  deactivate(id: string): Promise<void> {
    return this.setStatus(id, 'INACTIVE');
  }

  private async setStatus(id: string, status: ProductStatus): Promise<void> {
    const updated = await this.answered(this.api.updateProductStatus(id, status, crypto.randomUUID()));
    this.items.update(current => current.map(p => (p.id === id ? { ...p, status: updated.status } : p)));
  }

  private async answered(request: Observable<Product>): Promise<Product> {
    try {
      return await firstValueFrom(request);
    } catch (err) {
      throw new Error(messageOf(err));
    }
  }
}

function toAdminProduct(product: Product): AdminProduct {
  return {
    id: product.id,
    name: product.name,
    category: product.category ?? '',
    price: product.price,
    stock: product.availableStock ?? 0,
    status: product.status,
  };
}
