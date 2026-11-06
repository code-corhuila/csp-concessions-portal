import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderDraftService } from '../data/order-draft.service';
import { SnackCatalogService } from '../data/snack-catalog.service';
import { SnackOrderService } from '../data/snack-order.service';
import { CatalogItem } from '../model/catalog-item';
import { Order } from '../model/order';
import { formatCents } from '../model/money';

/** Customer step of the purchase flow: choose snacks and see the order grow (HU-FE-CONCESSIONS-001). */
@Component({
  selector: 'app-snack-selection-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './snack-selection-page.component.css',
  templateUrl: './snack-selection-page.component.html',
})
export class SnackSelectionPageComponent {
  protected readonly order = inject(OrderDraftService);
  protected readonly catalog = inject(SnackCatalogService);
  private readonly orders = inject(SnackOrderService);
  /** The reservation of the seats the client holds; Booking sends the client here with it in the address. */
  protected readonly reservationId = reservationOf(inject(ActivatedRoute).snapshot.queryParamMap.get('reservationId'));
  protected readonly sending = signal(false);
  protected readonly orderError = signal('');
  protected readonly placed = signal<Order | null>(null);

  protected readonly products = computed(() => this.catalog.items().filter(item => item.kind === 'PRODUCT'));
  protected readonly combos = computed(() => this.catalog.items().filter(item => item.kind === 'COMBO'));
  protected readonly money = formatCents;

  constructor() {
    void this.catalog.load();
  }

  protected async placeOrder(): Promise<void> {
    this.sending.set(true);
    this.orderError.set('');
    try {
      this.placed.set(await this.orders.place(this.reservationId));
    } catch (err) {
      this.orderError.set(err instanceof Error ? err.message : '');
    } finally {
      this.sending.set(false);
    }
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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Only a UUID can be a reservation: anything else in the address is ignored. */
function reservationOf(value: string | null): string | undefined {
  return value !== null && UUID.test(value) ? value : undefined;
}
