import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminProductsStore } from '../data/admin-products.store';
import { formatCents } from '../model/money';
import { ProductStatus } from '../model/product';

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  INACTIVE: 'Inactivo',
};

/** Products of the administration area: they are listed, created and published or deactivated through the API (HU-CONCESSIONS-006). */
@Component({
  selector: 'app-products-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  styleUrl: './admin-page.css',
  templateUrl: './products-page.component.html',
})
export class ProductsPageComponent implements OnInit {
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

  ngOnInit(): void {
    void this.store.load();
  }

  protected async save(): Promise<void> {
    const { name, category, price } = this.form.getRawValue();
    // The form takes units of currency; the store keeps integer cents (ADR-011).
    const created = await this.attempt(() => this.store.create({ name, category, price: price === null ? NaN : Math.round(price * 100) }));
    if (created) {
      this.form.reset();
      this.saved.set('Producto guardado. Puedes publicarlo cuando esté listo.');
    }
  }

  protected publish(id: string): Promise<boolean> {
    return this.attempt(() => this.store.publish(id));
  }

  protected deactivate(id: string): Promise<boolean> {
    return this.attempt(() => this.store.deactivate(id));
  }

  /** Runs a change of the store and shows why it was refused, if it was. */
  private async attempt(change: () => Promise<void>): Promise<boolean> {
    this.error.set('');
    this.saved.set('');
    try {
      await change();
      return true;
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo guardar el producto.');
      return false;
    }
  }
}
