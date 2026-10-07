import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { STANDALONE_ROUTES } from './standalone.routes';

describe('standalone routes', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(STANDALONE_ROUTES)] });
    router = TestBed.inject(Router);
  });

  it('opens the customer snack selection from the root, at its documented address', async () => {
    await RouterTestingHarness.create('/');
    expect(router.url).toBe('/booking/snack-selection');
  });

  it('opens the products screen at the start of the administration area', async () => {
    await RouterTestingHarness.create('/admin/concessions');
    expect(router.url).toBe('/admin/concessions/products');
  });

  it('keeps the administration screens under /admin/concessions', async () => {
    await RouterTestingHarness.create('/admin/concessions/products');
    expect(router.url).toBe('/admin/concessions/products');
  });

  it('does not offer the snack selection inside the administration area', async () => {
    // The router rejects an address no route matches: the customer screen has no place in the admin area.
    await expectAsync(RouterTestingHarness.create('/admin/concessions/snack-selection')).toBeRejected();
  });
});
