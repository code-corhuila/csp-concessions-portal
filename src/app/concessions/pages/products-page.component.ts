import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminProductsStore } from '../data/admin-products.store';
import { formatCents } from '../model/money';
import { ProductStatus } from '../model/product';

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  INACTIVE: 'Inactivo',
};

/** Products of the administration area (HU-FE-CONCESSIONS-001, synthetic data in Cut 2). */
@Component({
  selector: 'app-products-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  styleUrl: './admin-page.css',
  templateUrl: './products-page.component.html',
})
export class ProductsPageComponent {
  protected readonly store = inject(AdminProductsStore);
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    category: new FormControl('', { nonNullable: true }),
    price: new FormControl<number | null>(null),
  });
  protected readonly error = signal('');
  protected readonly saved = signal('');
  protected readonly money = formatCents;
  protected readonly statusLabel = (status: ProductStatus): string => STATUS_LABELS[status];

  protected save(): void {
    const { name, category, price } = this.form.getRawValue();
    this.error.set('');
    this.saved.set('');
    try {
      // The form takes units of currency; the store keeps integer cents (ADR-011).
      this.store.create({ name, category, price: price === null ? NaN : Math.round(price * 100) });
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo guardar el producto.');
      return;
    }
    this.form.reset();
    this.saved.set('Producto guardado. Puedes publicarlo cuando esté listo.');
  }
}
