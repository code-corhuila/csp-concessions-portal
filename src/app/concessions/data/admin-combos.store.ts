import { Injectable, computed, inject, signal } from '@angular/core';
import { Combo, ComboItem } from '../model/combo';
import { moneyInCents } from '../model/money';
import { AdminProductsStore } from './admin-products.store';

export interface NewCombo {
  name: string;
  price: number;
  items: ComboItem[];
}

/** The combos of the administration area, in memory: a page reload restores the synthetic one. */
@Injectable({ providedIn: 'root' })
export class AdminCombosStore {
  private readonly products = inject(AdminProductsStore);
  private readonly items = signal<readonly Combo[]>([
    {
      id: '65000000-0000-0000-0000-000000000001',
      name: 'Combo Familiar',
      price: moneyInCents(1200),
      status: 'PUBLISHED',
      items: [
        { productId: '61000000-0000-0000-0000-000000000001', quantity: 2 },
        { productId: '61000000-0000-0000-0000-000000000002', quantity: 1 },
      ],
    },
  ]);

  readonly combos = this.items.asReadonly();
  readonly availableProducts = computed(() => this.products.products().filter(p => p.status === 'PUBLISHED'));

  /** A combo is made of published products in positive whole quantities, and is published once saved. */
  create(combo: NewCombo): void {
    const name = combo.name.trim();
    if (name === '') {
      throw new Error('El nombre es obligatorio.');
    }
    if (!Number.isInteger(combo.price) || combo.price < 0) {
      throw new Error('El precio debe ser un monto no negativo.');
    }
    if (combo.items.length === 0) {
      throw new Error('Elige al menos un producto.');
    }
    if (combo.items.some(i => !Number.isInteger(i.quantity) || i.quantity < 1)) {
      throw new Error('Las cantidades deben ser enteros positivos.');
    }
    const published = new Set(this.availableProducts().map(p => p.id));
    if (combo.items.some(i => !published.has(i.productId))) {
      throw new Error('Solo los productos publicados pueden formar un combo.');
    }
    this.items.update(current => [
      ...current,
      { id: crypto.randomUUID(), name, price: moneyInCents(combo.price), status: 'PUBLISHED', items: combo.items },
    ]);
  }

  /** "2× Popcorn, 1× Nachos": the components of a combo by name. */
  describe(combo: Combo): string {
    const names = new Map(this.products.products().map(p => [p.id, p.name]));
    return combo.items.map(i => `${i.quantity}× ${names.get(i.productId) ?? i.productId}`).join(', ');
  }
}
