import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminProductsStore } from '../data/admin-products.store';
import { formatCents, moneyInCents } from '../model/money';
import { ProductsPageComponent } from './products-page.component';

describe('ProductsPageComponent', () => {
  let fixture: ComponentFixture<ProductsPageComponent>;
  let page: HTMLElement;

  const texts = (selector: string): string[] =>
    Array.from(page.querySelectorAll(selector)).map(e => e.textContent!.replace(/\s+/g, ' ').trim());
  const type = (selector: string, value: string): void => {
    const input = page.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const submit = (): void => {
    page.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProductsPageComponent] }).compileComponents();
    fixture = TestBed.createComponent(ProductsPageComponent);
    fixture.detectChanges();
    page = fixture.nativeElement;
  });

  it('lists every product with category, price, stock and status in Spanish', () => {
    const rows = texts('[data-testid="product-row"]');

    expect(rows.length).toBe(4);
    expect(rows[0]).toContain('Popcorn (large)');
    expect(rows[0]).toContain('Comida');
    expect(rows[0]).toContain(formatCents(moneyInCents(500)));
    expect(rows[0]).toContain('Publicado');
    expect(rows[3]).toContain('Borrador');
  });

  it('saves a new product as a draft and says so', () => {
    type('#product-name', 'Hot dog');
    type('#product-category', 'Comida');
    type('#product-price', '4.5');
    submit();

    const rows = texts('[data-testid="product-row"]');
    expect(rows.length).toBe(5);
    expect(rows[4]).toContain('Hot dog');
    expect(rows[4]).toContain(formatCents(moneyInCents(450)));
    expect(rows[4]).toContain('Borrador');
    expect(texts('[role="status"]')).toEqual(['Producto guardado. Puedes publicarlo cuando esté listo.']);
  });

  it('shows the reason when the product is rejected and keeps the list', () => {
    type('#product-name', '   ');
    type('#product-category', 'Comida');
    type('#product-price', '4');
    submit();

    expect(texts('[role="alert"]')).toEqual(['El nombre es obligatorio.']);
    expect(page.querySelectorAll('[data-testid="product-row"]').length).toBe(4);
  });

  it('rejects a negative price', () => {
    type('#product-name', 'Water');
    type('#product-category', 'Bebida');
    type('#product-price', '-1');
    submit();

    expect(texts('[role="alert"]')).toEqual(['El precio debe ser un monto no negativo.']);
  });

  it('publishes a draft and deactivates a published product from the table', () => {
    page.querySelector<HTMLButtonElement>('[aria-label="Publicar Soda (medium)"]')!.click();
    fixture.detectChanges();
    expect(texts('[data-testid="product-row"]')[3]).toContain('Publicado');

    page.querySelector<HTMLButtonElement>('[aria-label="Desactivar Popcorn (large)"]')!.click();
    fixture.detectChanges();
    expect(texts('[data-testid="product-row"]')[0]).toContain('Inactivo');
  });

  it('converts a price with cents to integer cents without float errors', () => {
    type('#product-name', 'Menu');
    type('#product-category', 'Comida');
    type('#product-price', '19.99');
    submit();

    expect(texts('[data-testid="product-row"]')[4]).toContain(formatCents(moneyInCents(1999)));
    expect(texts('[role="alert"]')).toEqual([]);
  });

  it('rejects a product with no price', () => {
    type('#product-name', 'Menu');
    type('#product-category', 'Comida');
    submit();

    expect(texts('[role="alert"]')).toEqual(['El precio debe ser un monto no negativo.']);
  });
});
