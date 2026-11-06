import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminInventoryStore } from './admin-inventory.store';
import { AdminProductsStore } from './admin-products.store';
import {
  ADJUST_URL, API_MOVEMENTS, MOVEMENTS_URL, PRODUCTS_URL, answerLoad, movementsPage, seedInventory,
} from './admin-inventory.fixture.spec';
import { API_PRODUCTS, DRAFT, POPCORN } from './admin-products.fixture.spec';

describe('AdminInventoryStore', () => {
  let store: AdminInventoryStore;
  let products: AdminProductsStore;
  let http: HttpTestingController;

  const tick = (): Promise<void> => new Promise(resolve => setTimeout(resolve));
  const stockOf = (id: string): number => products.products().find(p => p.id === id)!.stock;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    products = TestBed.inject(AdminProductsStore);
    store = await seedInventory();
  });

  afterEach(() => http.verify());

  it('lists the stock movements of the API, newest first', () => {
    expect(store.movements().map(m => [m.productName, m.quantityDelta, m.reason])).toEqual([
      ['Nachos with cheese', 25, 'RECEIPT'],
      ['Popcorn (large)', -5, 'ADJUSTMENT'],
    ]);
    expect(store.loadError()).toBe('');
  });

  it('reads every page of the movements', async () => {
    const loading = store.load();
    http.expectOne(request => request.url === PRODUCTS_URL).flush({ data: API_PRODUCTS, meta: { page: 1, limit: 100, total: 4, totalPages: 1 } });
    await tick();
    http.expectOne(request => request.url === MOVEMENTS_URL && request.params.get('page') === '1')
      .flush(movementsPage(API_MOVEMENTS, 1, 2));
    await tick();
    http.expectOne(request => request.url === MOVEMENTS_URL && request.params.get('page') === '2')
      .flush(movementsPage([{ ...API_MOVEMENTS[1], id: 'm0' }], 2, 2));
    await loading;

    expect(store.movements().map(m => m.id)).toEqual(['m2', 'm1', 'm0']);
  });

  it('keeps the history and says why when the movements cannot be loaded', async () => {
    const loading = store.load();
    http.expectOne(request => request.url === PRODUCTS_URL).flush({ data: API_PRODUCTS, meta: { page: 1, limit: 100, total: 4, totalPages: 1 } });
    await tick();
    http.expectOne(request => request.url === MOVEMENTS_URL).flush('', { status: 503, statusText: 'Service Unavailable' });
    await loading;

    expect(store.movements().length).toBe(2);
    expect(store.loadError()).not.toBe('');
  });

  it('sends a receipt to the API and reads the balances and the history again', async () => {
    const adjusting = store.adjust({ productId: DRAFT, quantityDelta: 12 });

    const post = http.expectOne(ADJUST_URL);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ productId: DRAFT, quantityDelta: 12 });
    expect(post.request.headers.get('Idempotency-Key')).toMatch(/^[0-9a-f-]{36}$/);
    post.flush(null, { status: 204, statusText: 'No Content' });
    await tick();
    http.expectOne(request => request.url === PRODUCTS_URL).flush({
      data: API_PRODUCTS.map(p => (p.id === DRAFT ? { ...p, availableStock: 12 } : p)),
      meta: { page: 1, limit: 100, total: 4, totalPages: 1 },
    });
    await tick();
    http.expectOne(request => request.url === MOVEMENTS_URL).flush(movementsPage([
      { id: 'm3', productId: DRAFT, productName: 'Soda (medium)', quantityDelta: 12, reason: 'RECEIPT', timestamp: '2026-10-02T10:00:00.000Z' },
      ...API_MOVEMENTS,
    ]));
    await adjusting;

    expect(stockOf(DRAFT)).toBe(12);
    expect(store.movements()[0]).toEqual(jasmine.objectContaining({ productName: 'Soda (medium)', quantityDelta: 12, reason: 'RECEIPT' }));
  });

  it('takes stock out through the same endpoint', async () => {
    const adjusting = store.adjust({ productId: POPCORN, quantityDelta: -15 });

    const post = http.expectOne(ADJUST_URL);
    expect(post.request.body).toEqual({ productId: POPCORN, quantityDelta: -15 });
    post.flush(null, { status: 204, statusText: 'No Content' });
    await tick();
    await answerLoad();
    await adjusting;
  });

  it('rejects with the reason of the API and reads nothing again when it refuses the adjustment', async () => {
    const adjusting = store.adjust({ productId: POPCORN, quantityDelta: -10 });
    http.expectOne(ADJUST_URL).flush(
      { error: 'INSUFFICIENT_STOCK', message: 'No stock', traceId: 't' },
      { status: 409, statusText: 'Conflict' });

    await expectAsync(adjusting).toBeRejected();
    expect(stockOf(POPCORN)).toBe(40);
  });

  it('rejects an adjustment that would leave negative stock without calling the API', async () => {
    await expectAsync(store.adjust({ productId: POPCORN, quantityDelta: -41 }))
      .toBeRejectedWithError('El ajuste dejaría el stock en negativo.');
    expect(stockOf(POPCORN)).toBe(40);
  });

  it('rejects a zero or fractional quantity and an unknown product without calling the API', async () => {
    await expectAsync(store.adjust({ productId: POPCORN, quantityDelta: 0 })).toBeRejectedWithError('La cantidad debe ser un entero distinto de cero.');
    await expectAsync(store.adjust({ productId: POPCORN, quantityDelta: 1.5 })).toBeRejectedWithError('La cantidad debe ser un entero distinto de cero.');
    await expectAsync(store.adjust({ productId: 'missing', quantityDelta: 1 })).toBeRejectedWithError('El producto no existe.');
    expect(store.movements().length).toBe(2);
  });
});
