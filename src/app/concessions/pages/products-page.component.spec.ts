import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { formatCents, moneyInCents } from '../model/money';
import { API_PRODUCTS, DRAFT, INACTIVE, POPCORN, showProducts } from '../data/admin-products.fixture.spec';
import { ProductsPageComponent } from './products-page.component';

const PRODUCTS_URL = '/api/v1/concessions/products';

describe('ProductsPageComponent', () => {
  let fixture: ComponentFixture<ProductsPageComponent>;
  let page: HTMLElement;
  let http: HttpTestingController;

  const texts = (selector: string): string[] =>
    Array.from(page.querySelectorAll(selector)).map(e => e.textContent!.replace(/\s+/g, ' ').trim());
  const type = (selector: string, value: string): void => {
    const input = page.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  // The store answers after the request is flushed, a few microtasks later.
  const settle = async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();
  };
  const submit = (): void => {
    page.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
  };
  const submitted = async (): Promise<void> => {
    submit();
    await settle();
  };
  const click = (label: string): void => {
    page.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!.click();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductsPageComponent);
    http = TestBed.inject(HttpTestingController);
    page = fixture.nativeElement;
    await showProducts(fixture);
  });

  afterEach(() => http.verify());

  it('lists every product of the API with category, price, stock and status in Spanish', () => {
    const rows = texts('[data-testid="product-row"]');

    expect(rows.length).toBe(4);
    expect(rows[0]).toContain('Popcorn (large)');
    expect(rows[0]).toContain('Comida');
    expect(rows[0]).toContain(formatCents(moneyInCents(500)));
    expect(rows[0]).toContain('Publicado');
    expect(rows[2]).toContain('Inactivo');
    expect(rows[3]).toContain('Borrador');
  });

  it('offers the action that fits each status', () => {
    expect(page.querySelector('[aria-label="Desactivar Popcorn (large)"]')).not.toBeNull();
    expect(page.querySelector('[aria-label="Reactivar Limited edition combo"]')).not.toBeNull();
    expect(page.querySelector('[aria-label="Publicar Soda (medium)"]')).not.toBeNull();
  });

  it('saves a new product as a draft through the API and says so', async () => {
    type('#product-name', 'Hot dog');
    type('#product-category', 'Comida');
    type('#product-price', '4.5');
    submit();

    const request = http.expectOne(PRODUCTS_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Hot dog', category: 'Comida', price: 450 });
    request.flush({ id: 'new-1', name: 'Hot dog', category: 'Comida', price: 450, availableStock: 0, status: 'DRAFT' });
    await settle();

    const rows = texts('[data-testid="product-row"]');
    expect(rows.length).toBe(5);
    expect(rows[4]).toContain('Hot dog');
    expect(rows[4]).toContain(formatCents(moneyInCents(450)));
    expect(rows[4]).toContain('Borrador');
    expect(texts('[role="status"]')).toEqual(['Producto guardado. Puedes publicarlo cuando esté listo.']);
  });

  it('shows the reason when the product is rejected and keeps the list', async () => {
    type('#product-name', '   ');
    type('#product-category', 'Comida');
    type('#product-price', '4');
    await submitted();

    expect(texts('[role="alert"]')).toEqual(['El nombre es obligatorio.']);
    expect(page.querySelectorAll('[data-testid="product-row"]').length).toBe(4);
  });

  it('rejects a negative price and a missing price', async () => {
    type('#product-name', 'Water');
    type('#product-category', 'Bebida');
    type('#product-price', '-1');
    await submitted();
    expect(texts('[role="alert"]')).toEqual(['El precio debe ser un monto no negativo.']);

    type('#product-price', '');
    await submitted();
    expect(texts('[role="alert"]')).toEqual(['El precio debe ser un monto no negativo.']);
  });

  it('converts a price with cents to integer cents without float errors', async () => {
    type('#product-name', 'Menu');
    type('#product-category', 'Comida');
    type('#product-price', '19.99');
    submit();

    const request = http.expectOne(PRODUCTS_URL);
    expect(request.request.body.price).toBe(1999);
    request.flush({ id: 'new-2', name: 'Menu', category: 'Comida', price: 1999, availableStock: 0, status: 'DRAFT' });
    await settle();
    expect(texts('[role="alert"]')).toEqual([]);
  });

  it('publishes a draft through the API and shows the new status', async () => {
    click('Publicar Soda (medium)');

    const request = http.expectOne(`${PRODUCTS_URL}/${DRAFT}`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'PUBLISHED' });
    request.flush({ ...API_PRODUCTS[3], status: 'PUBLISHED' });
    await settle();

    expect(texts('[data-testid="product-row"]')[3]).toContain('Publicado');
  });

  it('deactivates a published product and the order of the table does not change', async () => {
    click('Desactivar Popcorn (large)');

    const request = http.expectOne(`${PRODUCTS_URL}/${POPCORN}`);
    expect(request.request.body).toEqual({ status: 'INACTIVE' });
    request.flush({ ...API_PRODUCTS[0], status: 'INACTIVE' });
    await settle();

    expect(texts('[data-testid="product-row"]')[0]).toContain('Popcorn (large)');
    expect(texts('[data-testid="product-row"]')[0]).toContain('Inactivo');
  });

  it('reactivates an inactive product as published', async () => {
    click('Reactivar Limited edition combo');

    const request = http.expectOne(`${PRODUCTS_URL}/${INACTIVE}`);
    expect(request.request.body).toEqual({ status: 'PUBLISHED' });
    request.flush({ ...API_PRODUCTS[2], status: 'PUBLISHED' });
    await settle();

    expect(texts('[data-testid="product-row"]')[2]).toContain('Publicado');
  });

  it('keeps the status and says so when the API refuses the transition', async () => {
    click('Desactivar Popcorn (large)');

    http.expectOne(`${PRODUCTS_URL}/${POPCORN}`).flush(
      { status: 409, code: 'INVALID_STATUS_TRANSITION', message: 'no', details: [], traceId: 't', userMessage: 'Ese cambio de estado no está permitido.' },
      { status: 409, statusText: 'Conflict' });
    await settle();

    expect(texts('[data-testid="product-row"]')[0]).toContain('Publicado');
    expect(texts('[role="alert"]').length).toBe(1);
  });
});
