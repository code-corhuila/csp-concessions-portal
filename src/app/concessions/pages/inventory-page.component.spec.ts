import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ADJUST_URL, answerLoad, showInventory } from '../data/admin-inventory.fixture.spec';
import { DRAFT, POPCORN } from '../data/admin-products.fixture.spec';
import { InventoryPageComponent } from './inventory-page.component';

describe('InventoryPageComponent', () => {
  let fixture: ComponentFixture<InventoryPageComponent>;
  let page: HTMLElement;
  let http: HttpTestingController;

  const texts = (selector: string): string[] =>
    Array.from(page.querySelectorAll(selector)).map(e => e.textContent!.replace(/\s+/g, ' ').trim());
  const type = (selector: string, value: string): void => {
    const input = page.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const choose = (value: string): void => {
    const select = page.querySelector<HTMLSelectElement>('#inventory-product')!;
    select.value = value;
    select.dispatchEvent(new Event('change'));
  };
  // The store answers after each request is flushed, a few microtasks later.
  const settle = async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();
  };
  const submit = async (): Promise<void> => {
    page.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await settle();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(InventoryPageComponent);
    http = TestBed.inject(HttpTestingController);
    page = fixture.nativeElement;
    await showInventory(fixture);
  });

  afterEach(() => http.verify());

  it('shows the stock of every product with its status', () => {
    const rows = texts('[data-testid="stock-row"]');

    expect(rows.length).toBe(4);
    expect(rows[0]).toContain('Popcorn (large)');
    expect(rows[0]).toContain('40');
    expect(rows[0]).toContain('Publicado');
  });

  it('lists the movements of the API with their date, product, quantity and type in Spanish', () => {
    const rows = texts('[data-testid="movement-row"]');

    expect(rows.length).toBe(2);
    expect(rows[0]).toContain('Nachos with cheese');
    expect(rows[0]).toContain('+25');
    expect(rows[0]).toContain('Entrada');
    expect(rows[1]).toContain('-5');
    expect(rows[1]).toContain('Ajuste');
  });

  it('has no free-text reason: the API records the type of the movement', () => {
    expect(page.querySelector('#inventory-reason')).toBeNull();
  });

  it('registers an adjustment through the API and shows the new balance', async () => {
    choose(DRAFT);
    type('#inventory-quantity', '12');
    await submit();

    const post = http.expectOne(ADJUST_URL);
    expect(post.request.body).toEqual({ productId: DRAFT, quantityDelta: 12 });
    post.flush(null, { status: 204, statusText: 'No Content' });
    await settle();
    await answerLoad();
    fixture.detectChanges();

    expect(texts('[role="status"]')).toEqual(['Ajuste registrado.']);
  });

  it('says why an adjustment is rejected and keeps the stock', async () => {
    choose(POPCORN);
    type('#inventory-quantity', '-100');
    await submit();

    expect(texts('[role="alert"]')).toEqual(['El ajuste dejaría el stock en negativo.']);
    expect(texts('[data-testid="stock-row"]')[0]).toContain('40');
  });
});
