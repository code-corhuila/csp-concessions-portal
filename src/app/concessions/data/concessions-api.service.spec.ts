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
});
