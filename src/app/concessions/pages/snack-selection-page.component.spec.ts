import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { OrderDraftService } from '../data/order-draft.service';
import { COMBOS_URL, PRODUCTS_URL, answerCatalog, httpController } from '../data/snack-catalog.fixture.spec';
import { formatCents, moneyInCents } from '../model/money';
import { SnackSelectionPageComponent } from './snack-selection-page.component';

const ORDERS_URL = '/api/v1/concessions/orders';
const RESERVATION = '7c1d0000-0000-4000-8000-000000000001';

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
  const settle = async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();
  };

  /** Renders the page as the shell mounts it, with the query string of the address; it asks the API for the catalog. */
  const open = async (query: Record<string, string>, answer: () => void): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [SnackSelectionPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    }).compileComponents();
    TestBed.inject(OrderDraftService).clear();
    fixture = TestBed.createComponent(SnackSelectionPageComponent);
    fixture.detectChanges();
    answer();
    await settle();
    page = fixture.nativeElement;
  };

  afterEach(() => httpController().verify());

  describe('with the catalog of the API and a reservation', () => {
    beforeEach(() => open({ reservationId: RESERVATION }, () => answerCatalog(httpController())));

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

    it('cannot send an empty order', () => {
      expect((page.querySelector('[data-testid="place-order"]') as HTMLButtonElement).disabled).toBeTrue();
    });

    it('sends the order with the reservation and offers to continue to the payment', async () => {
      click('[aria-label="Agregar Popcorn (large)"]');
      click('[data-testid="place-order"]');
      const request = httpController().expectOne(ORDERS_URL);
      expect(request.request.body.reservationId).toBe(RESERVATION);
      request.flush(
        { id: '8e000000-0000-4000-8000-000000000001', status: 'RESERVED', totalAmount: 500, items: [] },
        { status: 201, statusText: 'Created' },
      );
      await settle();

      expect(texts('[data-testid="order-placed"]').length).toBe(1);
      expect(page.querySelector('[data-testid="order-line"]')).toBeNull();
      expect(page.querySelector('[data-testid="place-order"]')).toBeNull();
      expect(page.querySelector('[data-testid="continue"]')?.getAttribute('href')).toBe(`/booking/checkout/${RESERVATION}`);
    });

    it('says why the order was refused and keeps what the client chose', async () => {
      click('[aria-label="Agregar Popcorn (large)"]');
      click('[data-testid="place-order"]');
      httpController().expectOne(ORDERS_URL).flush('', { status: 409, statusText: 'Conflict' });
      await settle();

      expect(texts('[data-testid="order-error"]').length).toBe(1);
      expect(page.querySelector('[data-testid="order-placed"]')).toBeNull();
      expect(texts('[data-testid="order-line"] .line-name')).toEqual(['Popcorn (large)']);
    });

    it('lets the client skip the snacks and go to the payment', () => {
      expect(page.querySelector('[data-testid="continue"]')?.getAttribute('href')).toBe(`/booking/checkout/${RESERVATION}`);
      expect(texts('[data-testid="continue"]')).toEqual(['Omitir']);
    });
  });

  describe('without a reservation in the address', () => {
    beforeEach(() => open({}, () => answerCatalog(httpController())));

    it('sends the order without reservation and has no way to continue to the payment', () => {
      click('[aria-label="Agregar Popcorn (large)"]');
      click('[data-testid="place-order"]');
      const request = httpController().expectOne(ORDERS_URL);

      expect('reservationId' in request.request.body).toBeFalse();
      expect(page.querySelector('[data-testid="continue"]')).toBeNull();
      request.flush('', { status: 503, statusText: 'Service Unavailable' });
    });
  });

  describe('with an address that carries something that is not a reservation', () => {
    beforeEach(() => open({ reservationId: '../../admin' }, () => answerCatalog(httpController())));

    it('ignores it', () => {
      click('[aria-label="Agregar Popcorn (large)"]');
      click('[data-testid="place-order"]');
      const request = httpController().expectOne(ORDERS_URL);

      expect('reservationId' in request.request.body).toBeFalse();
      expect(page.querySelector('[data-testid="continue"]')).toBeNull();
      request.flush('', { status: 503, statusText: 'Service Unavailable' });
    });
  });

  describe('when the API fails', () => {
    beforeEach(() =>
      open({ reservationId: RESERVATION }, () => {
        const http = httpController();
        http.expectOne(request => request.url === PRODUCTS_URL).flush('', { status: 503, statusText: 'Service Unavailable' });
        http.expectOne(request => request.url === COMBOS_URL).flush('', { status: 503, statusText: 'Service Unavailable' });
      }),
    );

    it('says that the catalog is not available and lists nothing', () => {
      expect(texts('[data-testid="load-error"]').length).toBe(1);
      expect(page.querySelector('[data-testid="product"]')).toBeNull();
      expect(page.querySelector('[data-testid="combo"]')).toBeNull();
    });
  });
});
