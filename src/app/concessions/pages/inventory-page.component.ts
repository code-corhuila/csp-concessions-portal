import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminInventoryStore } from '../data/admin-inventory.store';
import { AdminProductsStore } from '../data/admin-products.store';
import { ProductStatus } from '../model/product';

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  INACTIVE: 'Inactivo',
};

/** The type the API records for each movement: a receipt for a positive quantity, an adjustment for a negative one. */
const MOVEMENT_LABELS: Record<string, string> = {
  RECEIPT: 'Entrada',
  ADJUSTMENT: 'Ajuste',
};

/** Inventory of the administration area: balances, adjustments and movement history through the API (HU-CONCESSIONS-003 and 007). */
@Component({
  selector: 'app-inventory-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe],
  styleUrl: './admin-page.css',
  templateUrl: './inventory-page.component.html',
})
export class InventoryPageComponent implements OnInit {
  protected readonly products = inject(AdminProductsStore);
  protected readonly inventory = inject(AdminInventoryStore);
  protected readonly form = new FormGroup({
    productId: new FormControl('', { nonNullable: true }),
    quantityDelta: new FormControl<number | null>(null),
  });
  protected readonly error = signal('');
  protected readonly saved = signal('');
  protected readonly statusLabel = (status: ProductStatus): string => STATUS_LABELS[status];
  protected readonly movementLabel = (type: string): string => MOVEMENT_LABELS[type] ?? type;

  ngOnInit(): void {
    void this.inventory.load();
  }

  protected async save(): Promise<void> {
    const { productId, quantityDelta } = this.form.getRawValue();
    this.error.set('');
    this.saved.set('');
    try {
      await this.inventory.adjust({ productId, quantityDelta: quantityDelta ?? NaN });
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'No se pudo registrar el ajuste.');
      return;
    }
    this.form.reset();
    this.saved.set('Ajuste registrado.');
  }
}
