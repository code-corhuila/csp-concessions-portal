import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { moneyInCents } from '../model/money';
import { Page } from '../model/pagination';
import { Product } from '../model/product';
import { AdminProductsStore } from './admin-products.store';

export const POPCORN = '61000000-0000-0000-0000-000000000001';
export const NACHOS = '61000000-0000-0000-0000-000000000002';
export const INACTIVE = '61000000-0000-0000-0000-000000000003';
export const DRAFT = '61000000-0000-0000-0000-000000000004';

/** The products the API answers in these specs: synthetic values in the shape of the contract. */
export const API_PRODUCTS: Product[] = [
  { id: POPCORN, name: 'Popcorn (large)', category: 'Comida', price: moneyInCents(500), availableStock: 40, status: 'PUBLISHED' },
  { id: NACHOS, name: 'Nachos with cheese', category: 'Comida', price: moneyInCents(350), availableStock: 25, status: 'PUBLISHED' },
  { id: INACTIVE, name: 'Limited edition combo', category: 'Comida', price: moneyInCents(990), availableStock: 0, status: 'INACTIVE' },
  { id: DRAFT, name: 'Soda (medium)', category: 'Bebida', price: moneyInCents(400), availableStock: 0, status: 'DRAFT' },
];

export function productsPage(data: Product[], page = 1, totalPages = 1): Page<Product> {
  return { data, meta: { page, limit: 100, total: data.length, totalPages } };
}

/** Renders a page that loads the products when it starts and answers that request as the API would. */
export async function showProducts(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  TestBed.inject(HttpTestingController)
    .expectOne(request => request.url === '/api/v1/concessions/products')
    .flush(productsPage(API_PRODUCTS));
  await new Promise(resolve => setTimeout(resolve));
  fixture.detectChanges();
}

/** Loads the store with the products above, answering its request as the API would. */
export async function seedProducts(): Promise<AdminProductsStore> {
  const store = TestBed.inject(AdminProductsStore);
  const http = TestBed.inject(HttpTestingController);
  const loading = store.load();
  http.expectOne(request => request.url === '/api/v1/concessions/products').flush(productsPage(API_PRODUCTS));
  await loading;
  return store;
}
