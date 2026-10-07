import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderDraftService } from '../data/order-draft.service';
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SnackSelectionPageComponent] }).compileComponents();
    TestBed.inject(OrderDraftService).clear();
    fixture = TestBed.createComponent(SnackSelectionPageComponent);
    fixture.detectChanges();
    page = fixture.nativeElement;
  });

  it('lists the published products and combos with their price', () => {
    expect(texts('[data-testid="product"] h3')).toEqual(['Popcorn (large)', 'Nachos with cheese']);
    expect(texts('[data-testid="combo"] h3')).toEqual(['Combo Familiar']);
    expect(texts('[data-testid="product"] .price')[0]).toBe(cents(500));
  });

  it('does not list an item that is not published', () => {
    expect(page.textContent).not.toContain('Limited edition combo');
  });

  it('starts with an empty order', () => {
    expect(texts('[data-testid="empty-order"]')).toEqual(['Your order is empty.']);
    expect(texts('[data-testid="total"]')).toEqual([cents(0)]);
  });

  it('shows each added item with its quantity and the computed total', () => {
    click('[aria-label="Add Popcorn (large)"]');
    click('[aria-label="Add Popcorn (large)"]');
    click('[aria-label="Add Combo Familiar"]');

    expect(texts('[data-testid="order-line"] .line-name')).toEqual(['Popcorn (large)', 'Combo Familiar']);
    expect(texts('[data-testid="order-line"] .line-quantity')).toEqual(['2', '1']);
    expect(texts('[data-testid="total"]')).toEqual([cents(2200)]);
    expect(page.querySelector('[data-testid="empty-order"]')).toBeNull();
  });

  it('changes a quantity and removes the line when it reaches zero', () => {
    click('[aria-label="Add Nachos with cheese"]');
    click('[aria-label="Increase Nachos with cheese"]');
    expect(texts('[data-testid="total"]')).toEqual([cents(700)]);

    click('[aria-label="Decrease Nachos with cheese"]');
    click('[aria-label="Decrease Nachos with cheese"]');
    expect(page.querySelector('[data-testid="order-line"]')).toBeNull();
    expect(texts('[data-testid="total"]')).toEqual([cents(0)]);
  });
});
