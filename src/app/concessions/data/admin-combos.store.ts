import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { Combo, ComboItem } from '../model/combo';
import { moneyInCents } from '../model/money';
import { AdminProductsStore } from './admin-products.store';
import { allPages, messageOf } from './api-calls';
import { ConcessionsApiService } from './concessions-api.service';

export interface NewCombo {
  name: string;
  price: number;
  items: ComboItem[];
}

/** The combos of the administration area, as csp-concessions-api holds them (HU-CONCESSIONS-002). */
@Injectable({ providedIn: 'root' })
export class AdminCombosStore {
  private readonly api = inject(ConcessionsApiService);
  private readonly products = inject(AdminProductsStore);
  private readonly items = signal<readonly Combo[]>([]);

  readonly combos = this.items.asReadonly();
  readonly availableProducts = computed(() => this.products.products().filter(p => p.status === 'PUBLISHED'));
  /** Why the last load failed; empty when it worked. */
  readonly loadError = signal('');

  /** Replaces the list with every page of the API. A failure keeps the list and sets {@link loadError}. */
  async load(): Promise<void> {
    try {
      this.items.set(await allPages((page, limit) => this.api.listCombos(page, limit)));
      this.loadError.set('');
    } catch (err) {
      this.loadError.set(messageOf(err));
    }
  }

  /**
   * A combo is made of published products in positive whole quantities. The API saves it as a draft and
   * checks the components when it is published; a refused publication leaves the draft in the list.
   */
  async create(combo: NewCombo): Promise<void> {
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
    const draft = await this.answered(this.api.createCombo(
      { name, price: moneyInCents(combo.price), items: combo.items },
      crypto.randomUUID(),
    ));
    this.items.update(current => [...current, draft]);
    const live = await this.answered(this.api.updateComboStatus(draft.id, 'PUBLISHED', crypto.randomUUID()));
    this.items.update(current => current.map(c => (c.id === draft.id ? live : c)));
  }

  /** "2× Popcorn, 1× Nachos": the components of a combo by name. */
  describe(combo: Combo): string {
    const names = new Map(this.products.products().map(p => [p.id, p.name]));
    return combo.items.map(i => `${i.quantity}× ${names.get(i.productId) ?? i.productId}`).join(', ');
  }

  private async answered(request: Observable<Combo>): Promise<Combo> {
    try {
      return await firstValueFrom(request);
    } catch (err) {
      throw new Error(messageOf(err));
    }
  }
}
