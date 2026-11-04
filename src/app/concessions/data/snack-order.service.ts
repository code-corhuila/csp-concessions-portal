import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Order, OrderRequest } from '../model/order';
import { messageOf } from './api-calls';
import { ConcessionsApiService } from './concessions-api.service';
import { OrderDraftService } from './order-draft.service';

/**
 * Sends the snack order the client built to csp-concessions-api (ADR-045). The same draft is sent with the same
 * Idempotency-Key, so a retry after a lost answer replays the order instead of reserving the stock twice; a draft
 * that changed is another order and gets another key.
 */
@Injectable({ providedIn: 'root' })
export class SnackOrderService {
  private readonly api = inject(ConcessionsApiService);
  private readonly draft = inject(OrderDraftService);
  private attempt: { signature: string; key: string } | null = null;

  /** Creates the order of the draft; the draft is emptied when the API accepts it. A refusal is thrown as an `Error` that carries its message. */
  async place(reservationId: string | undefined): Promise<Order> {
    if (this.draft.lines().length === 0) {
      throw new Error('Agrega al menos un producto o combo a tu pedido.');
    }
    const request = this.requestOf(reservationId);
    try {
      const order = await firstValueFrom(this.api.createOrder(request, this.keyOf(request)));
      this.draft.clear();
      this.attempt = null;
      return order;
    } catch (err) {
      throw new Error(messageOf(err));
    }
  }

  private requestOf(reservationId: string | undefined): OrderRequest {
    const items = this.draft.lines().map(line => ({ itemId: line.item.id, itemType: line.item.kind, quantity: line.quantity }));
    return reservationId === undefined ? { items } : { reservationId, items };
  }

  private keyOf(request: OrderRequest): string {
    const signature = JSON.stringify(request);
    if (this.attempt?.signature !== signature) {
      this.attempt = { signature, key: crypto.randomUUID() };
    }
    return this.attempt.key;
  }
}
