import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CONCESSIONS_ROUTES } from '../concessions.routes';

describe('AdminLayoutComponent', () => {
  let page: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(CONCESSIONS_ROUTES)] });
    const harness = await RouterTestingHarness.create('/products');
    page = harness.routeNativeElement!;
  });

  it('offers the three screens of the administration area in Spanish', () => {
    const links = Array.from(page.querySelectorAll('nav a')).map(a => [a.textContent, a.getAttribute('href')]);

    expect(links).toEqual([
      ['Productos', '/products'],
      ['Combos', '/combos'],
      ['Inventario', '/inventory'],
    ]);
  });

  it('marks the screen that is open', () => {
    expect(Array.from(page.querySelectorAll('nav a.active')).map(a => a.textContent)).toEqual(['Productos']);
  });

  it('opens each administration screen under the layout', async () => {
    const router = TestBed.inject(Router);
    const heading = () => page.querySelector('h1')?.textContent;

    await router.navigateByUrl('/combos');
    expect(heading()).toBe('Combos de Concessions');

    await router.navigateByUrl('/inventory');
    expect(heading()).toBe('Inventario de Concessions');

    await router.navigateByUrl('/orders');
    expect(page.querySelector('nav')).not.toBeNull();
  });
});
