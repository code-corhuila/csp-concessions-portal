import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { moneyInCents } from '../model/money';
import { API_PRODUCTS, POPCORN, productsPage } from './admin-products.fixture.spec';
import {
  API_COMBOS,
  COMBOS_URL,
  COMBO_FAMILIAR,
  PRODUCTS_URL,
  answerCatalog,
  combosPage,
} from './snack-catalog.fixture.spec';
import { SnackCatalogService } from './snack-catalog.service';

describe('SnackCatalogService', () => {
  let catalog: SnackCatalogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    catalog = TestBed.inject(SnackCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts empty until the catalog is loaded', () => {
    expect(catalog.items()).toEqual([]);
    expect(catalog.loadError()).toBe('');
  });

  it('lists the published products and combos of the API with their price', async () => {
    const loading = catalog.load();
    answerCatalog(http);
    await loading;

    expect(catalog.items().map(item => [item.kind, item.name, item.price])).toEqual([
      ['PRODUCT', 'Popcorn (large)', moneyInCents(500)],
      ['PRODUCT', 'Nachos with cheese', moneyInCents(350)],
      ['COMBO', 'Combo Familiar', moneyInCents(1200)],
    ]);
    expect(catalog.items().find(item => item.kind === 'COMBO')?.id).toBe(COMBO_FAMILIAR);
    expect(catalog.items().find(item => item.name === 'Popcorn (large)')?.id).toBe(POPCORN);
  });

  it('hides what is not published even if the API sends it', async () => {
    const loading = catalog.load();
    answerCatalog(http);
    await loading;

    const names = catalog.items().map(item => item.name);
    expect(names).not.toContain('Limited edition combo');
    expect(names).not.toContain('Soda (medium)');
    expect(names).not.toContain('Combo in preparation');
  });

  it('reads every page of products and of combos, 100 at a time', async () => {
    const loading = catalog.load();
    const firstProducts = http.expectOne(request => request.url === PRODUCTS_URL);
    const firstCombos = http.expectOne(request => request.url === COMBOS_URL);
    expect(firstProducts.request.params.get('page')).toBe('1');
    expect(firstProducts.request.params.get('limit')).toBe('100');
    expect(firstCombos.request.params.get('limit')).toBe('100');
    firstProducts.flush(productsPage(API_PRODUCTS.slice(0, 1), 1, 2));
    firstCombos.flush(combosPage(API_COMBOS.slice(0, 1), 1, 2));
    await new Promise(resolve => setTimeout(resolve));
    http.expectOne(request => request.url === PRODUCTS_URL && request.params.get('page') === '2')
      .flush(productsPage(API_PRODUCTS.slice(1, 2), 2, 2));
    http.expectOne(request => request.url === COMBOS_URL && request.params.get('page') === '2')
      .flush(combosPage(API_COMBOS.slice(1), 2, 2));
    await loading;

    expect(catalog.items().map(item => item.name)).toEqual(['Popcorn (large)', 'Nachos with cheese', 'Combo Familiar']);
  });

  it('keeps the list and says why when the catalog cannot be loaded', async () => {
    const first = catalog.load();
    answerCatalog(http);
    await first;

    const failing = catalog.load();
    http.expectOne(request => request.url === PRODUCTS_URL).flush('', { status: 503, statusText: 'Service Unavailable' });
    http.expectOne(request => request.url === COMBOS_URL).flush(combosPage(API_COMBOS));
    await failing;

    expect(catalog.items().length).toBe(3);
    expect(catalog.loadError()).not.toBe('');
  });

  it('clears the error when a later load works', async () => {
    const failing = catalog.load();
    http.expectOne(request => request.url === PRODUCTS_URL).flush('', { status: 503, statusText: 'Service Unavailable' });
    http.expectOne(request => request.url === COMBOS_URL).flush('', { status: 503, statusText: 'Service Unavailable' });
    await failing;
    expect(catalog.loadError()).not.toBe('');

    const loading = catalog.load();
    answerCatalog(http);
    await loading;

    expect(catalog.loadError()).toBe('');
  });
});
