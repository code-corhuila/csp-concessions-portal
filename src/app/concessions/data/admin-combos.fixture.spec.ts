import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Combo } from '../model/combo';
import { moneyInCents } from '../model/money';
import { Page } from '../model/pagination';
import { API_PRODUCTS, NACHOS, POPCORN, productsPage } from './admin-products.fixture.spec';
import { AdminCombosStore } from './admin-combos.store';
import { AdminProductsStore } from './admin-products.store';

export const COMBOS_URL = '/api/v1/concessions/combos';

/** The combos the API answers in these specs: synthetic values in the shape of the contract. */
export const API_COMBOS: Combo[] = [
  {
    id: '65000000-0000-0000-0000-000000000001',
    name: 'Combo Familiar',
    price: moneyInCents(1200),
    status: 'PUBLISHED',
    items: [{ productId: POPCORN, quantity: 2 }, { productId: NACHOS, quantity: 1 }],
  },
];

export function combosPage(data: Combo[], page = 1, totalPages = 1): Page<Combo> {
  return { data, meta: { page, limit: 100, total: data.length, totalPages } };
}

/** Renders a page that loads products and combos when it starts, answering both requests as the API would. */
export async function showCombos(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  const http = TestBed.inject(HttpTestingController);
  http.expectOne(request => request.url === '/api/v1/concessions/products').flush(productsPage(API_PRODUCTS));
  http.expectOne(request => request.url === COMBOS_URL).flush(combosPage(API_COMBOS));
  await new Promise(resolve => setTimeout(resolve));
  fixture.detectChanges();
}

/** Loads the products and combos stores with the values above. */
export async function seedCombos(): Promise<AdminCombosStore> {
  const http = TestBed.inject(HttpTestingController);
  const products = TestBed.inject(AdminProductsStore).load();
  http.expectOne(request => request.url === '/api/v1/concessions/products').flush(productsPage(API_PRODUCTS));
  await products;
  const store = TestBed.inject(AdminCombosStore);
  const combos = store.load();
  http.expectOne(request => request.url === COMBOS_URL).flush(combosPage(API_COMBOS));
  await combos;
  return store;
}
