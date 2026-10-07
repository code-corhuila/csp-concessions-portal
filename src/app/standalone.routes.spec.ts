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

  it('opens the snack selection from the root, under /concessions like inside the shell', async () => {
    await RouterTestingHarness.create('/');
    expect(router.url).toBe('/concessions/snack-selection');
  });

  it('keeps the other concessions screens reachable under /concessions', async () => {
    await RouterTestingHarness.create('/concessions/products');
    expect(router.url).toBe('/concessions/products');
  });
});
