import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminCombosStore } from '../data/admin-combos.store';
import { formatCents } from '../model/money';
import { ProductStatus } from '../model/product';

/** Combos of the administration area (HU-FE-CONCESSIONS-001, synthetic data in Cut 2). */
@Component({
  selector: 'app-combos-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  styleUrl: './admin-page.css',
  templateUrl: './combos-page.component.html',
})
export class CombosPageComponent {
  protected readonly store = inject(AdminCombosStore);
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    price: new FormControl<number | null>(null),
  });
  protected readonly quantities = signal<Record<string, number>>({});
  protected readonly error = signal('');
  protected readonly saved = signal('');
  protected readonly money = formatCents;
  protected readonly statusLabel = (status: ProductStatus): string => (status === 'PUBLISHED' ? 'Publicado' : 'Inactivo');

  protected setQuantity(productId: string, value: string): void {
    this.quantities.update(current => ({ ...current, [productId]: Number(value) }));
  }

  protected save(): void {
    const { name, price } = this.form.getRawValue();
    const items = Object.entries(this.quantities())
      .filter(([, quantity]) => quantity !== 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    this.error.set('');
    this.saved.set('');
    try {
      this.store.create({ name, price: price === null ? NaN : Math.round(price * 100), items });
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo guardar el combo.');
      return;
    }
    this.form.reset();
    this.quantities.set({});
    this.saved.set('Combo guardado.');
  }
}
