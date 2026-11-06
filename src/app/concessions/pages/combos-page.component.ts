import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminCombosStore } from '../data/admin-combos.store';
import { AdminProductsStore } from '../data/admin-products.store';
import { formatCents } from '../model/money';
import { ProductStatus } from '../model/product';

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  INACTIVE: 'Inactivo',
};

/** Combos of the administration area: they are listed and created through the API (HU-CONCESSIONS-002). */
@Component({
  selector: 'app-combos-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  styleUrl: './admin-page.css',
  templateUrl: './combos-page.component.html',
})
export class CombosPageComponent implements OnInit {
  private readonly products = inject(AdminProductsStore);
  protected readonly store = inject(AdminCombosStore);
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    price: new FormControl<number | null>(null),
  });
  protected readonly quantities = signal<Record<string, number>>({});
  protected readonly error = signal('');
  protected readonly saved = signal('');
  protected readonly money = formatCents;
  protected readonly statusLabel = (status: ProductStatus): string => STATUS_LABELS[status];

  ngOnInit(): void {
    void this.products.load();
    void this.store.load();
  }

  protected setQuantity(productId: string, value: string): void {
    this.quantities.update(current => ({ ...current, [productId]: Number(value) }));
  }

  protected async save(): Promise<void> {
    const { name, price } = this.form.getRawValue();
    const items = Object.entries(this.quantities())
      .filter(([, quantity]) => quantity !== 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    this.error.set('');
    this.saved.set('');
    try {
      await this.store.create({ name, price: price === null ? NaN : Math.round(price * 100), items });
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo guardar el combo.');
      return;
    }
    this.form.reset();
    this.quantities.set({});
    this.saved.set('Combo guardado.');
  }
}
