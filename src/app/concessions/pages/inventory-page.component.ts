import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminInventoryStore } from '../data/admin-inventory.store';
import { AdminProductsStore } from '../data/admin-products.store';
import { ProductStatus } from '../model/product';

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  INACTIVE: 'Inactivo',
};

/** Inventory of the administration area (HU-FE-CONCESSIONS-001, synthetic data in Cut 2). */
@Component({
  selector: 'app-inventory-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe],
  styleUrl: './admin-page.css',
  templateUrl: './inventory-page.component.html',
})
export class InventoryPageComponent {
  protected readonly products = inject(AdminProductsStore);
  protected readonly inventory = inject(AdminInventoryStore);
  protected readonly form = new FormGroup({
    productId: new FormControl('', { nonNullable: true }),
    quantityDelta: new FormControl<number | null>(null),
    reason: new FormControl('', { nonNullable: true }),
  });
  protected readonly error = signal('');
  protected readonly saved = signal('');
  protected readonly statusLabel = (status: ProductStatus): string => STATUS_LABELS[status];

  protected save(): void {
    const { productId, quantityDelta, reason } = this.form.getRawValue();
    this.error.set('');
    this.saved.set('');
    try {
      this.inventory.adjust({ productId, quantityDelta: quantityDelta ?? NaN, reason });
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo registrar el ajuste.');
      return;
    }
    this.form.reset();
    this.saved.set('Ajuste registrado.');
  }
}
