import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { moneyInCents } from '../model/money';
import { AdminProductsStore } from './admin-products.store';
import { API_PRODUCTS, DRAFT, POPCORN, productsPage, seedProducts } from './admin-products.fixture.spec';

const PRODUCTS_URL = '/api/v1/concessions/products';

describe('AdminProductsStore', () => {
  let store: AdminProductsStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    store = TestBed.inject(AdminProductsStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts empty until the products are loaded', () => {
    expect(store.products()).toEqual([]);
  });

  it('loads the products of the API, whatever their status, with the stock they report', async () => {
    await seedProducts();

    expect(store.products().map(p => [p.name, p.status, p.stock])).toEqual([
      ['Popcorn (large)', 'PUBLISHED', 40],
      ['Nachos with cheese', 'PUBLISHED', 25],
      ['Limited edition combo', 'INACTIVE', 0],
      ['Soda (medium)', 'DRAFT', 0],
    ]);
  });

  it('reads every page the API has, 100 products at a time', async () => {
    const loading = store.load();
    const first = http.expectOne(request => request.url === PRODUCTS_URL);
    expect(first.request.params.get('page')).toBe('1');
    expect(first.request.params.get('limit')).toBe('100');
    first.flush(productsPage(API_PRODUCTS.slice(0, 2), 1, 2));
    await Promise.resolve();
    await Promise.resolve();
    const second = http.expectOne(request => request.url === PRODUCTS_URL && request.params.get('page') === '2');
    second.flush(productsPage(API_PRODUCTS.slice(2), 2, 2));
    await loading;

    expect(store.products().length).toBe(4);
  });

  it('keeps the list and says why when the products cannot be loaded', async () => {
    await seedProducts();
    const loading = store.load();
    http.expectOne(request => request.url === PRODUCTS_URL).flush('', { status: 503, statusText: 'Service Unavailable' });
    await loading;

    expect(store.products().length).toBe(4);
    expect(store.loadError()).not.toBe('');
  });

  it('creates a product through the API as a draft with the price in cents', async () => {
    const created = store.create({ name: '  Hot dog ', category: 'Comida', price: moneyInCents(450) });
    const request = http.expectOne(PRODUCTS_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Hot dog', category: 'Comida', price: 450 });
    expect(request.request.headers.get('Idempotency-Key')).toMatch(/^[0-9a-f-]{36}$/);
    request.flush({ id: 'new-1', name: 'Hot dog', category: 'Comida', price: 450, availableStock: 0, status: 'DRAFT' });
    await created;

    const added = store.products().at(-1)!;
    expect([added.name, added.status, added.stock, added.price]).toEqual(['Hot dog', 'DRAFT', 0, moneyInCents(450)]);
  });

  it('rejects an empty name without calling the API', async () => {
    await expectAsync(store.create({ name: '   ', category: 'Comida', price: moneyInCents(100) }))
      .toBeRejectedWithError('El nombre es obligatorio.');
  });

  it('rejects a price that is not a non-negative integer of cents without calling the API', async () => {
    for (const price of [-1, 1.5, NaN]) {
      await expectAsync(store.create({ name: 'Water', category: 'Bebida', price: price as never }))
        .toBeRejectedWithError('El precio debe ser un monto no negativo.');
    }
  });

  it('publishes a draft with a PATCH and shows the status the API answers', async () => {
    await seedProducts();

    const publishing = store.publish(DRAFT);
    const request = http.expectOne(`${PRODUCTS_URL}/${DRAFT}`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'PUBLISHED' });
    expect(request.request.headers.get('Idempotency-Key')).toMatch(/^[0-9a-f-]{36}$/);
    request.flush({ ...API_PRODUCTS[3], status: 'PUBLISHED' });
    await publishing;

    expect(store.products().find(p => p.id === DRAFT)!.status).toBe('PUBLISHED');
  });

  it('deactivates a published product and reactivates it', async () => {
    await seedProducts();

    const deactivating = store.deactivate(POPCORN);
    const off = http.expectOne(`${PRODUCTS_URL}/${POPCORN}`);
    expect(off.request.body).toEqual({ status: 'INACTIVE' });
    off.flush({ ...API_PRODUCTS[0], status: 'INACTIVE' });
    await deactivating;
    expect(store.products().find(p => p.id === POPCORN)!.status).toBe('INACTIVE');

    const reactivating = store.publish(POPCORN);
    http.expectOne(`${PRODUCTS_URL}/${POPCORN}`).flush({ ...API_PRODUCTS[0], status: 'PUBLISHED' });
    await reactivating;
    expect(store.products().find(p => p.id === POPCORN)!.status).toBe('PUBLISHED');
  });

  it('keeps the status and rejects when the API refuses the transition', async () => {
    await seedProducts();

    const publishing = store.publish(POPCORN);
    http.expectOne(`${PRODUCTS_URL}/${POPCORN}`).flush(
      { error: 'INVALID_STATUS_TRANSITION', message: 'no', traceId: 't' },
      { status: 409, statusText: 'Conflict' });

    await expectAsync(publishing).toBeRejected();
    expect(store.products().find(p => p.id === POPCORN)!.status).toBe('PUBLISHED');
  });
});
