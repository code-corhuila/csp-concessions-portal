import { Injectable, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { asApiError } from '../../shell-contract';
import { AdminProduct, NewProduct } from '../model/admin-product';
import { moneyInCents } from '../model/money';
import { Product, ProductStatus } from '../model/product';
import { ConcessionsApiService } from './concessions-api.service';

/** The largest page the contract allows. */
const PAGE_SIZE = 100;
const FALLBACK_MESSAGE = 'No se pudo completar la operación. Inténtalo de nuevo.';

/**
 * The products of the administration area, as csp-concessions-api holds them. The stock shown is the one the
 * API reports; an adjustment made in the inventory screen is kept in memory (it has no endpoint here yet).
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
      const loaded: Product[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const answer = await firstValueFrom(this.api.listProducts(page, PAGE_SIZE));
        loaded.push(...answer.data);
        totalPages = answer.meta.totalPages;
        page++;
      } while (page <= totalPages);
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

  /** Used by the inventory: the new stock and the reason of the last movement. */
  setStock(id: string, stock: number, reason: string): void {
    this.items.update(current => current.map(p => (p.id === id ? { ...p, stock, lastReason: reason } : p)));
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

function messageOf(err: unknown): string {
  const apiError = asApiError(err);
  return apiError.code === 'UNKNOWN' ? FALLBACK_MESSAGE : apiError.userMessage;
}

function toAdminProduct(product: Product): AdminProduct {
  return {
    id: product.id,
    name: product.name,
    category: product.category ?? '',
    price: product.price,
    stock: product.availableStock ?? 0,
    status: product.status,
    lastReason: '',
  };
}
