import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderDraftService } from '../data/order-draft.service';
import { COMBOS_URL, PRODUCTS_URL, answerCatalog, httpController } from '../data/snack-catalog.fixture.spec';
import { formatCents, moneyInCents } from '../model/money';
import { SnackSelectionPageComponent } from './snack-selection-page.component';

describe('SnackSelectionPageComponent', () => {
  let fixture: ComponentFixture<SnackSelectionPageComponent>;
  let page: HTMLElement;

  const texts = (selector: string): string[] =>
    Array.from(page.querySelectorAll(selector)).map(e => e.textContent!.replace(/\s+/g, ' ').trim());
  // The price follows the locale of the browser, so the expectations use the same formatter.
  const cents = (value: number): string => formatCents(moneyInCents(value));
  const click = (selector: string): void => {
    (page.querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
  };

  /** Renders the page; it asks the API for the catalog when it starts, and the answer arrives later. */
  const open = async (answer: () => void): Promise<void> => {
    fixture = TestBed.createComponent(SnackSelectionPageComponent);
    fixture.detectChanges();
    answer();
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();
    page = fixture.nativeElement;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnackSelectionPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    TestBed.inject(OrderDraftService).clear();
    await open(() => answerCatalog(httpController()));
  });

  afterEach(() => httpController().verify());

  it('lists the published products and combos with their price', () => {
    expect(texts('[data-testid="product"] h3')).toEqual(['Popcorn (large)', 'Nachos with cheese']);
    expect(texts('[data-testid="combo"] h3')).toEqual(['Combo Familiar']);
    expect(texts('[data-testid="product"] .price')[0]).toBe(cents(500));
  });

  it('does not list an item that is not published', () => {
    expect(page.textContent).not.toContain('Limited edition combo');
    expect(page.textContent).not.toContain('Soda (medium)');
    expect(page.textContent).not.toContain('Combo in preparation');
  });

  it('shows no error when the catalog loads', () => {
    expect(page.querySelector('[data-testid="load-error"]')).toBeNull();
  });

  it('starts with an empty order', () => {
    expect(texts('[data-testid="empty-order"]')).toEqual(['Tu pedido está vacío.']);
    expect(texts('[data-testid="total"]')).toEqual([cents(0)]);
  });

  it('shows each added item with its quantity and the computed total', () => {
    click('[aria-label="Agregar Popcorn (large)"]');
    click('[aria-label="Agregar Popcorn (large)"]');
    click('[aria-label="Agregar Combo Familiar"]');

    expect(texts('[data-testid="order-line"] .line-name')).toEqual(['Popcorn (large)', 'Combo Familiar']);
    expect(texts('[data-testid="order-line"] .line-quantity')).toEqual(['2', '1']);
    expect(texts('[data-testid="total"]')).toEqual([cents(2200)]);
    expect(page.querySelector('[data-testid="empty-order"]')).toBeNull();
  });

  it('changes a quantity and removes the line when it reaches zero', () => {
    click('[aria-label="Agregar Nachos with cheese"]');
    click('[aria-label="Aumentar Nachos with cheese"]');
    expect(texts('[data-testid="total"]')).toEqual([cents(700)]);

    click('[aria-label="Disminuir Nachos with cheese"]');
    click('[aria-label="Disminuir Nachos with cheese"]');
    expect(page.querySelector('[data-testid="order-line"]')).toBeNull();
    expect(texts('[data-testid="total"]')).toEqual([cents(0)]);
  });
});

describe('SnackSelectionPageComponent without the catalog', () => {
  it('says that the catalog is not available when the API fails', async () => {
    await TestBed.configureTestingModule({
      imports: [SnackSelectionPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(SnackSelectionPageComponent);
    fixture.detectChanges();
    const http = httpController();
    http.expectOne(request => request.url === PRODUCTS_URL).flush('', { status: 503, statusText: 'Service Unavailable' });
    http.expectOne(request => request.url === COMBOS_URL).flush('', { status: 503, statusText: 'Service Unavailable' });
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.querySelector('[data-testid="load-error"]')?.textContent?.trim()).not.toBe('');
    expect(page.querySelector('[data-testid="load-error"]')).not.toBeNull();
    expect(page.querySelector('[data-testid="product"]')).toBeNull();
    expect(page.querySelector('[data-testid="combo"]')).toBeNull();
    http.verify();
  });
});
