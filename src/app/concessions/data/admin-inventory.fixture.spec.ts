import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Page } from '../model/pagination';
import { StockMovement } from '../model/stock-movement';
import { API_PRODUCTS, NACHOS, POPCORN, productsPage } from './admin-products.fixture.spec';
import { AdminInventoryStore } from './admin-inventory.store';

export const PRODUCTS_URL = '/api/v1/concessions/products';
export const MOVEMENTS_URL = '/api/v1/concessions/stock/movements';
export const ADJUST_URL = '/api/v1/concessions/stock/adjust';

/** The movements the API answers in these specs, newest first: synthetic values in the shape of the contract. */
export const API_MOVEMENTS: StockMovement[] = [
  { id: 'm2', productId: NACHOS, productName: 'Nachos with cheese', quantityDelta: 25, reason: 'RECEIPT', timestamp: '2026-10-01T09:05:00.000Z' },
  { id: 'm1', productId: POPCORN, productName: 'Popcorn (large)', quantityDelta: -5, reason: 'ADJUSTMENT', timestamp: '2026-10-01T09:00:00.000Z' },
];

export function movementsPage(data: StockMovement[], page = 1, totalPages = 1): Page<StockMovement> {
  return { data, meta: { page, limit: 100, total: data.length, totalPages } };
}

const tick = (): Promise<void> => new Promise(resolve => setTimeout(resolve));

/** Answers the two reads of a load as the API would: the products first, the movements once those are in. */
export async function answerLoad(movements = API_MOVEMENTS): Promise<void> {
  const http = TestBed.inject(HttpTestingController);
  http.expectOne(request => request.url === PRODUCTS_URL).flush(productsPage(API_PRODUCTS));
  await tick();
  http.expectOne(request => request.url === MOVEMENTS_URL).flush(movementsPage(movements));
  await tick();
}

/** Renders a page that loads the inventory when it starts and answers the requests as the API would. */
export async function showInventory(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await answerLoad();
  fixture.detectChanges();
}

/** Loads the inventory store with the products and movements above. */
export async function seedInventory(): Promise<AdminInventoryStore> {
  const store = TestBed.inject(AdminInventoryStore);
  const loading = store.load();
  await answerLoad();
  await loading;
  return store;
}
