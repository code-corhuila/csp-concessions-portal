import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Combo } from '../model/combo';
import { moneyInCents } from '../model/money';
import { Page } from '../model/pagination';
import { API_PRODUCTS, POPCORN, productsPage } from './admin-products.fixture.spec';

export const PRODUCTS_URL = '/api/v1/concessions/products';
export const COMBOS_URL = '/api/v1/concessions/combos';

export const COMBO_FAMILIAR = '65000000-0000-0000-0000-000000000001';
export const COMBO_DRAFT = '65000000-0000-0000-0000-000000000002';

/** The combos the API answers in these specs: synthetic values in the shape of the contract. */
export const API_COMBOS: Combo[] = [
  { id: COMBO_FAMILIAR, name: 'Combo Familiar', price: moneyInCents(1200), items: [{ productId: POPCORN, quantity: 2 }], status: 'PUBLISHED' },
  { id: COMBO_DRAFT, name: 'Combo in preparation', price: moneyInCents(800), items: [{ productId: POPCORN, quantity: 1 }], status: 'DRAFT' },
];

export function combosPage(data: Combo[], page = 1, totalPages = 1): Page<Combo> {
  return { data, meta: { page, limit: 100, total: data.length, totalPages } };
}

/** Answers the two requests that the catalog sends when it loads, as the API would. */
export function answerCatalog(http: HttpTestingController): void {
  http.expectOne(request => request.url === PRODUCTS_URL).flush(productsPage(API_PRODUCTS));
  http.expectOne(request => request.url === COMBOS_URL).flush(combosPage(API_COMBOS));
}

export function httpController(): HttpTestingController {
  return TestBed.inject(HttpTestingController);
}
