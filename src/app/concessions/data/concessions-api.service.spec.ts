import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { moneyInCents } from '../model/money';
import { ProductStatus } from '../model/product';
import { ConcessionsApiService } from './concessions-api.service';

describe('ConcessionsApiService', () => {
  let service: ConcessionsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConcessionsApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConcessionsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the concessions products contract and pagination', () => {
    service.listProducts(2, 20).subscribe();

    const request = http.expectOne(request =>
      request.url === '/api/v1/concessions/products'
      && request.params.get('page') === '2'
      && request.params.get('limit') === '20');
    expect(request.request.method).toBe('GET');
    request.flush({ data: [], meta: { page: 2, limit: 20, total: 0, totalPages: 0 } });
  });

  it('sends an idempotency key for order creation', () => {
    const body = { items: [{ itemId: 'product-1', itemType: 'PRODUCT' as const, quantity: 1 }] };
    service.createOrder(body, 'order-key').subscribe();

    const request = http.expectOne('/api/v1/concessions/orders');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Idempotency-Key')).toBe('order-key');
    expect(request.request.body).toEqual(body);
    request.flush({ id: 'order-1', status: 'RESERVED', totalAmount: moneyInCents(500) });
  });

  it('sends an idempotency key for product creation', () => {
    service.createProduct({ name: 'Popcorn', price: moneyInCents(500) }, 'product-key').subscribe();

    const request = http.expectOne('/api/v1/concessions/products');
    expect(request.request.headers.get('Idempotency-Key')).toBe('product-key');
    request.flush({ id: 'product-1', name: 'Popcorn', price: 500, status: 'DRAFT' });
  });

  it('sends an idempotency key for combo creation', () => {
    service.createCombo({
      name: 'Movie combo',
      price: moneyInCents(1000),
      items: [{ productId: 'product-1', quantity: 1 }],
    }, 'combo-key').subscribe();

    const request = http.expectOne('/api/v1/concessions/combos');
    expect(request.request.headers.get('Idempotency-Key')).toBe('combo-key');
    request.flush({ id: 'combo-1', name: 'Movie combo', price: 1000, items: [], status: 'DRAFT' });
  });

  it('sends an idempotency key for product status updates', () => {
    const status: ProductStatus = 'PUBLISHED';
    service.updateProductStatus('product-1', status, 'status-key').subscribe();

    const request = http.expectOne('/api/v1/concessions/products/product-1');
    expect(request.request.headers.get('Idempotency-Key')).toBe('status-key');
    expect(request.request.body).toEqual({ status });
    request.flush({ id: 'product-1', name: 'Popcorn', price: 500, status });
  });

  it('lists combos, orders and stock movements with the same pagination', () => {
    const pagination = (url: string) => (r: { url: string; params: { get(k: string): string | null } }) =>
      r.url === url && r.params.get('page') === '1' && r.params.get('limit') === '10';
    service.listCombos(1, 10).subscribe();
    service.listOrders(1, 10).subscribe();
    service.listStockMovements(1, 10).subscribe();

    for (const url of ['combos', 'orders', 'stock/movements']) {
      const request = http.expectOne(pagination(`/api/v1/concessions/${url}`));
      expect(request.request.method).toBe('GET');
      request.flush({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } });
    }
  });

  it('reads an order by id, encoding the id', () => {
    service.getOrder('a/b').subscribe();

    const request = http.expectOne('/api/v1/concessions/orders/a%2Fb');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'a/b', status: 'RESERVED', totalAmount: moneyInCents(500), items: [] });
  });

  it('sends an idempotency key to cancel an order', () => {
    service.cancelOrder('order-1', 'cancel-key').subscribe();

    const request = http.expectOne('/api/v1/concessions/orders/order-1/cancel');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Idempotency-Key')).toBe('cancel-key');
    request.flush(null);
  });

  it('sends an idempotency key for stock adjustments', () => {
    service.adjustStock({ productId: 'product-1', quantityDelta: -3 }, 'stock-key').subscribe();

    const request = http.expectOne('/api/v1/concessions/stock/adjust');
    expect(request.request.headers.get('Idempotency-Key')).toBe('stock-key');
    expect(request.request.body).toEqual({ productId: 'product-1', quantityDelta: -3 });
    request.flush(null);
  });

  it('rejects negative monetary values', () => {
    expect(() => moneyInCents(-1)).toThrowError(
      'Money values must be non-negative integer cents.');
  });
});
