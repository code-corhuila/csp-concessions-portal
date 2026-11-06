import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { moneyInCents } from '../model/money';
import { AdminCombosStore } from './admin-combos.store';
import { AdminProductsStore } from './admin-products.store';
import { API_COMBOS, COMBOS_URL, combosPage, seedCombos } from './admin-combos.fixture.spec';
import { API_PRODUCTS, DRAFT, INACTIVE, NACHOS, POPCORN } from './admin-products.fixture.spec';

describe('AdminCombosStore', () => {
  let store: AdminCombosStore;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    store = await seedCombos();
  });

  afterEach(() => http.verify());

  it('lists the combos of the API', () => {
    expect(store.combos().map(c => [c.name, c.price, c.status])).toEqual([
      ['Combo Familiar', moneyInCents(1200), 'PUBLISHED'],
    ]);
    expect(store.loadError()).toBe('');
  });

  it('reads every page of the combos', async () => {
    const loading = store.load();
    http.expectOne(request => request.url === COMBOS_URL && request.params.get('page') === '1')
      .flush(combosPage(API_COMBOS, 1, 2));
    await new Promise(resolve => setTimeout(resolve));
    http.expectOne(request => request.url === COMBOS_URL && request.params.get('page') === '2')
      .flush(combosPage([{ ...API_COMBOS[0], id: 'second', name: 'Pareja' }], 2, 2));
    await loading;

    expect(store.combos().map(c => c.name)).toEqual(['Combo Familiar', 'Pareja']);
  });

  it('keeps the list and says why when the combos cannot be loaded', async () => {
    const loading = store.load();
    http.expectOne(request => request.url === COMBOS_URL).flush('', { status: 503, statusText: 'Service Unavailable' });
    await loading;

    expect(store.combos().length).toBe(1);
    expect(store.loadError()).not.toBe('');
  });

  it('names the components of a combo with their quantities', () => {
    expect(store.describe(store.combos()[0])).toBe('2× Popcorn (large), 1× Nachos with cheese');
  });

  it('names a component by its id when the product is unknown', () => {
    const combo = { ...store.combos()[0], items: [{ productId: 'gone', quantity: 3 }] };

    expect(store.describe(combo)).toBe('3× gone');
  });

  it('saves the combo as a draft and then publishes it', async () => {
    const items = [{ productId: POPCORN, quantity: 1 }, { productId: NACHOS, quantity: 1 }];
    const creating = store.create({ name: ' Pareja ', price: moneyInCents(900), items });

    const post = http.expectOne(COMBOS_URL);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ name: 'Pareja', price: 900, items });
    expect(post.request.headers.get('Idempotency-Key')).toMatch(/^[0-9a-f-]{36}$/);
    post.flush({ id: 'new-1', name: 'Pareja', price: 900, items, status: 'DRAFT' });
    await new Promise(resolve => setTimeout(resolve));

    const patch = http.expectOne(`${COMBOS_URL}/new-1`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ status: 'PUBLISHED' });
    expect(patch.request.headers.get('Idempotency-Key')).toMatch(/^[0-9a-f-]{36}$/);
    patch.flush({ id: 'new-1', name: 'Pareja', price: 900, items, status: 'PUBLISHED' });
    await creating;

    const created = store.combos().at(-1)!;
    expect([created.name, created.status, created.price]).toEqual(['Pareja', 'PUBLISHED', moneyInCents(900)]);
  });

  it('leaves the draft in the list and rejects when the API refuses to publish it', async () => {
    const items = [{ productId: POPCORN, quantity: 1 }];
    const creating = store.create({ name: 'Solo', price: moneyInCents(500), items });
    http.expectOne(COMBOS_URL).flush({ id: 'new-2', name: 'Solo', price: 500, items, status: 'DRAFT' });
    await new Promise(resolve => setTimeout(resolve));
    http.expectOne(`${COMBOS_URL}/new-2`).flush(
      { error: 'UNPROCESSABLE_ENTITY', message: 'A component is not published', traceId: 't' },
      { status: 422, statusText: 'Unprocessable Entity' });

    await expectAsync(creating).toBeRejected();
    expect(store.combos().at(-1)!.status).toBe('DRAFT');
  });

  it('rejects when the API refuses to save the combo and adds nothing', async () => {
    const creating = store.create({ name: 'Solo', price: moneyInCents(500), items: [{ productId: POPCORN, quantity: 1 }] });
    http.expectOne(COMBOS_URL).flush('', { status: 503, statusText: 'Service Unavailable' });

    await expectAsync(creating).toBeRejected();
    expect(store.combos().length).toBe(1);
  });

  it('rejects an empty name, a bad price and a combo with no components without calling the API', async () => {
    const items = [{ productId: POPCORN, quantity: 1 }];

    await expectAsync(store.create({ name: ' ', price: 900, items })).toBeRejectedWithError('El nombre es obligatorio.');
    await expectAsync(store.create({ name: 'A', price: -1, items })).toBeRejectedWithError('El precio debe ser un monto no negativo.');
    await expectAsync(store.create({ name: 'A', price: 900, items: [] })).toBeRejectedWithError('Elige al menos un producto.');
    expect(store.combos().length).toBe(1);
  });

  it('rejects quantities that are not positive integers without calling the API', async () => {
    for (const quantity of [0, -2, 1.5]) {
      await expectAsync(store.create({ name: 'A', price: 900, items: [{ productId: POPCORN, quantity }] }))
        .toBeRejectedWithError('Las cantidades deben ser enteros positivos.');
    }
  });

  it('rejects a product that is not published or does not exist without calling the API', async () => {
    for (const productId of [INACTIVE, DRAFT, 'missing']) {
      await expectAsync(store.create({ name: 'A', price: 900, items: [{ productId, quantity: 1 }] }))
        .toBeRejectedWithError('Solo los productos publicados pueden formar un combo.');
    }
  });

  it('offers only the published products of the products store', async () => {
    const deactivating = TestBed.inject(AdminProductsStore).deactivate(NACHOS);
    http.expectOne('/api/v1/concessions/products/' + NACHOS).flush({ ...API_PRODUCTS[1], status: 'INACTIVE' });
    await deactivating;

    expect(store.availableProducts().map(p => p.id)).toEqual([POPCORN]);
  });
});
