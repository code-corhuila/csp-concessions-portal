import { ComponentFixture, TestBed } from '@angular/core/testing';
import { formatCents, moneyInCents } from '../model/money';
import { CombosPageComponent } from './combos-page.component';

describe('CombosPageComponent', () => {
  let fixture: ComponentFixture<CombosPageComponent>;
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
    await TestBed.configureTestingModule({ imports: [CombosPageComponent] }).compileComponents();
    fixture = TestBed.createComponent(CombosPageComponent);
    fixture.detectChanges();
    page = fixture.nativeElement;
  });

  it('lists the registered combos with their components, price and status', () => {
    const row = texts('[data-testid="combo-row"]')[0];

    expect(row).toContain('Combo Familiar');
    expect(row).toContain('2× Popcorn (large), 1× Nachos with cheese');
    expect(row).toContain(formatCents(moneyInCents(1200)));
    expect(row).toContain('Publicado');
  });

  it('offers only the published products as components', () => {
    expect(texts('[data-testid="component-name"]')).toEqual(['Popcorn (large)', 'Nachos with cheese']);
  });

  it('saves a combo with the chosen quantities', () => {
    type('#combo-name', 'Pareja');
    type('#combo-price', '9');
    type('[data-testid="component-quantity"]', '2');
    submit();

    const rows = texts('[data-testid="combo-row"]');
    expect(rows.length).toBe(2);
    expect(rows[1]).toContain('Pareja');
    expect(rows[1]).toContain('2× Popcorn (large)');
    expect(texts('[role="status"]')).toEqual(['Combo guardado.']);
  });

  it('says why a combo is rejected and keeps the list', () => {
    type('#combo-name', 'Pareja');
    type('#combo-price', '9');
    submit();

    expect(texts('[role="alert"]')).toEqual(['Elige al menos un producto.']);
    expect(page.querySelectorAll('[data-testid="combo-row"]').length).toBe(1);
  });
});
