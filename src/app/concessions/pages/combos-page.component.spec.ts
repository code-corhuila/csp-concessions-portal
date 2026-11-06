import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { COMBOS_URL, showCombos } from '../data/admin-combos.fixture.spec';
import { POPCORN } from '../data/admin-products.fixture.spec';
import { formatCents, moneyInCents } from '../model/money';
import { CombosPageComponent } from './combos-page.component';

describe('CombosPageComponent', () => {
  let fixture: ComponentFixture<CombosPageComponent>;
  let page: HTMLElement;
  let http: HttpTestingController;

  const texts = (selector: string): string[] =>
    Array.from(page.querySelectorAll(selector)).map(e => e.textContent!.replace(/\s+/g, ' ').trim());
  const type = (selector: string, value: string): void => {
    const input = page.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
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
      imports: [CombosPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(CombosPageComponent);
    http = TestBed.inject(HttpTestingController);
    page = fixture.nativeElement;
    await showCombos(fixture);
  });

  afterEach(() => http.verify());

  it('lists the combos of the API with their components, price and status', () => {
    const row = texts('[data-testid="combo-row"]')[0];

    expect(row).toContain('Combo Familiar');
    expect(row).toContain('2× Popcorn (large), 1× Nachos with cheese');
    expect(row).toContain(formatCents(moneyInCents(1200)));
    expect(row).toContain('Publicado');
  });

  it('offers only the published products as components', () => {
    expect(texts('[data-testid="component-name"]')).toEqual(['Popcorn (large)', 'Nachos with cheese']);
  });

  it('saves a combo with the chosen quantities through the API', async () => {
    type('#combo-name', 'Pareja');
    type('#combo-price', '9');
    type('[data-testid="component-quantity"]', '2');
    await submit();

    const post = http.expectOne(COMBOS_URL);
    expect(post.request.body).toEqual({ name: 'Pareja', price: 900, items: [{ productId: POPCORN, quantity: 2 }] });
    const created = { id: 'new-1', name: 'Pareja', price: 900, items: [{ productId: POPCORN, quantity: 2 }] };
    post.flush({ ...created, status: 'DRAFT' });
    await settle();
    http.expectOne(`${COMBOS_URL}/new-1`).flush({ ...created, status: 'PUBLISHED' });
    await settle();

    const rows = texts('[data-testid="combo-row"]');
    expect(rows.length).toBe(2);
    expect(rows[1]).toContain('Pareja');
    expect(rows[1]).toContain('2× Popcorn (large)');
    expect(texts('[role="status"]')).toEqual(['Combo guardado.']);
  });

  it('says why a combo is rejected and keeps the list', async () => {
    type('#combo-name', 'Pareja');
    type('#combo-price', '9');
    await submit();

    expect(texts('[role="alert"]')).toEqual(['Elige al menos un producto.']);
    expect(page.querySelectorAll('[data-testid="combo-row"]').length).toBe(1);
  });

  it('rejects a combo with no price', async () => {
    type('#combo-name', 'Pareja');
    type('[data-testid="component-quantity"]', '1');
    await submit();

    expect(texts('[role="alert"]')).toEqual(['El precio debe ser un monto no negativo.']);
  });

  it('shows a combo the API refused to publish as a draft with the reason', async () => {
    type('#combo-name', 'Pareja');
    type('#combo-price', '9');
    type('[data-testid="component-quantity"]', '1');
    await submit();
    const draft = { id: 'new-2', name: 'Pareja', price: 900, items: [{ productId: POPCORN, quantity: 1 }] };
    http.expectOne(COMBOS_URL).flush({ ...draft, status: 'DRAFT' });
    await settle();
    http.expectOne(`${COMBOS_URL}/new-2`).flush(
      { error: 'UNPROCESSABLE_ENTITY', message: 'A component is not published', traceId: 't' },
      { status: 422, statusText: 'Unprocessable Entity' });
    await settle();

    expect(texts('[role="alert"]').length).toBe(1);
    expect(texts('[data-testid="combo-row"]')[1]).toContain('Borrador');
  });
});
