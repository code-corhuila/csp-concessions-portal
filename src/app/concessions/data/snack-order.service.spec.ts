import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CatalogItem } from '../model/catalog-item';
import { moneyInCents } from '../model/money';
import { Order } from '../model/order';
import { OrderDraftService } from './order-draft.service';
import { SnackOrderService } from './snack-order.service';

const ORDERS_URL = '/api/v1/concessions/orders';
const RESERVATION = '7c1d0000-0000-4000-8000-000000000001';

const popcorn: CatalogItem = {
  id: '61000000-0000-0000-0000-000000000001', kind: 'PRODUCT', name: 'Popcorn (large)', price: moneyInCents(500), status: 'PUBLISHED',
};
const combo: CatalogItem = {
  id: '65000000-0000-0000-0000-000000000001', kind: 'COMBO', name: 'Combo Familiar', price: moneyInCents(1200), status: 'PUBLISHED',
};

function createdOrder(): Order {
  return {
    id: '8e000000-0000-4000-8000-000000000001',
    status: 'RESERVED',
    totalAmount: moneyInCents(2200),
    reservationId: RESERVATION,
    items: [],
  };
}

describe('SnackOrderService', () => {
  let order: SnackOrderService;
  let draft: OrderDraftService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    order = TestBed.inject(SnackOrderService);
    draft = TestBed.inject(OrderDraftService);
    http = TestBed.inject(HttpTestingController);
    draft.clear();
  });

  afterEach(() => http.verify());

  it('sends the lines of the draft and the reservation with an Idempotency-Key', async () => {
    draft.add(popcorn, 2);
    draft.add(combo);
    const placing = order.place(RESERVATION);

    const request = http.expectOne(ORDERS_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      reservationId: RESERVATION,
      items: [
        { itemId: popcorn.id, itemType: 'PRODUCT', quantity: 2 },
        { itemId: combo.id, itemType: 'COMBO', quantity: 1 },
      ],
    });
    expect(request.request.headers.get('Idempotency-Key')?.length).toBeGreaterThanOrEqual(8);
    request.flush(createdOrder(), { status: 201, statusText: 'Created' });
    expect((await placing).id).toBe(createdOrder().id);
  });

  it('omits the reservation when the client did not come from one', async () => {
    draft.add(popcorn);
    const placing = order.place(undefined);

    const request = http.expectOne(ORDERS_URL);
    expect('reservationId' in request.request.body).toBeFalse();
    request.flush(createdOrder(), { status: 201, statusText: 'Created' });
    await placing;
  });

  it('empties the draft once the order is created', async () => {
    draft.add(popcorn);
    const placing = order.place(RESERVATION);
    http.expectOne(ORDERS_URL).flush(createdOrder(), { status: 201, statusText: 'Created' });
    await placing;

    expect(draft.lines()).toEqual([]);
  });

  it('sends nothing for an empty draft', async () => {
    await expectAsync(order.place(RESERVATION)).toBeRejected();

    http.expectNone(ORDERS_URL);
  });

  it('keeps the draft and says why when the order is refused', async () => {
    draft.add(popcorn, 3);
    const placing = order.place(RESERVATION);
    http.expectOne(ORDERS_URL).flush('', { status: 409, statusText: 'Conflict' });

    await expectAsync(placing).toBeRejectedWithError(/./);
    expect(draft.lines().length).toBe(1);
  });

  it('repeats the same Idempotency-Key when the same draft is sent again', async () => {
    draft.add(popcorn);
    const first = order.place(RESERVATION);
    const firstRequest = http.expectOne(ORDERS_URL);
    const key = firstRequest.request.headers.get('Idempotency-Key');
    firstRequest.flush('', { status: 503, statusText: 'Service Unavailable' });
    await expectAsync(first).toBeRejected();

    const second = order.place(RESERVATION);
    const secondRequest = http.expectOne(ORDERS_URL);
    expect(secondRequest.request.headers.get('Idempotency-Key')).toBe(key);
    secondRequest.flush(createdOrder(), { status: 200, statusText: 'OK' });
    await second;
  });

  it('uses a new Idempotency-Key when the draft changed', async () => {
    draft.add(popcorn);
    const first = order.place(RESERVATION);
    const firstRequest = http.expectOne(ORDERS_URL);
    const key = firstRequest.request.headers.get('Idempotency-Key');
    firstRequest.flush('', { status: 503, statusText: 'Service Unavailable' });
    await expectAsync(first).toBeRejected();

    draft.add(combo);
    const second = order.place(RESERVATION);
    const secondRequest = http.expectOne(ORDERS_URL);
    expect(secondRequest.request.headers.get('Idempotency-Key')).not.toBe(key);
    secondRequest.flush(createdOrder(), { status: 201, statusText: 'Created' });
    await second;
  });
});
