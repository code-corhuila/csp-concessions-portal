import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryPageComponent } from './inventory-page.component';

describe('InventoryPageComponent', () => {
  let fixture: ComponentFixture<InventoryPageComponent>;
  let page: HTMLElement;

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
  const submit = (): void => {
    page.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InventoryPageComponent] }).compileComponents();
    fixture = TestBed.createComponent(InventoryPageComponent);
    fixture.detectChanges();
    page = fixture.nativeElement;
  });

  it('shows the stock of every product with its status and last reason', () => {
    const rows = texts('[data-testid="stock-row"]');

    expect(rows.length).toBe(4);
    expect(rows[0]).toContain('Popcorn (large)');
    expect(rows[0]).toContain('40');
    expect(rows[0]).toContain('Publicado');
    expect(rows[0]).toContain('Stock inicial');
  });

  it('registers an adjustment, updates the stock and lists the movement', () => {
    choose('61000000-0000-0000-0000-000000000004');
    type('#inventory-quantity', '12');
    type('#inventory-reason', 'Entrega');
    submit();

    expect(texts('[data-testid="stock-row"]')[3]).toContain('12');
    expect(texts('[data-testid="stock-row"]')[3]).toContain('Entrega');
    expect(texts('[data-testid="movement-row"]')[0]).toContain('Soda (medium)');
    expect(texts('[role="status"]')).toEqual(['Ajuste registrado.']);
  });

  it('says why an adjustment is rejected and keeps the stock', () => {
    choose('61000000-0000-0000-0000-000000000001');
    type('#inventory-quantity', '-100');
    type('#inventory-reason', 'Merma');
    submit();

    expect(texts('[role="alert"]')).toEqual(['El ajuste dejaría el stock en negativo.']);
    expect(texts('[data-testid="stock-row"]')[0]).toContain('40');
  });
});
