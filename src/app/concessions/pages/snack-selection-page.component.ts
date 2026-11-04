import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { OrderDraftService } from '../data/order-draft.service';
import { SnackCatalogService } from '../data/snack-catalog.service';
import { CatalogItem } from '../model/catalog-item';
import { formatCents } from '../model/money';

/** Customer step of the purchase flow: choose snacks and see the order grow (HU-FE-CONCESSIONS-001). */
@Component({
  selector: 'app-snack-selection-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './snack-selection-page.component.css',
  templateUrl: './snack-selection-page.component.html',
})
export class SnackSelectionPageComponent {
  protected readonly order = inject(OrderDraftService);
  protected readonly catalog = inject(SnackCatalogService);

  protected readonly products = computed(() => this.catalog.items().filter(item => item.kind === 'PRODUCT'));
  protected readonly combos = computed(() => this.catalog.items().filter(item => item.kind === 'COMBO'));
  protected readonly money = formatCents;

  constructor() {
    void this.catalog.load();
  }

  protected add(item: CatalogItem): void {
    this.order.add(item);
  }

  protected decrease(item: CatalogItem, quantity: number): void {
    if (quantity > 1) {
      this.order.setQuantity(item.id, quantity - 1);
    } else {
      this.order.remove(item.id);
    }
  }
}
