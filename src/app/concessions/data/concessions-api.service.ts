import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Combo, ComboRequest } from '../model/combo';
import { Order, OrderRequest } from '../model/order';
import { Page } from '../model/pagination';
import { Product, ProductRequest, ProductStatus } from '../model/product';
import { StockAdjustment, StockMovement } from '../model/stock-movement';

@Injectable({ providedIn: 'root' })
export class ConcessionsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/concessions';

  listProducts(page: number, limit: number): Observable<Page<Product>> {
    return this.http.get<Page<Product>>(`${this.base}/products`, { params: this.pagination(page, limit) });
  }

  createProduct(body: ProductRequest, idempotencyKey: string): Observable<Product> {
    return this.http.post<Product>(`${this.base}/products`, body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  updateProductStatus(id: string, status: ProductStatus, idempotencyKey: string): Observable<Product> {
    return this.http.patch<Product>(`${this.base}/products/${encodeURIComponent(id)}`, { status }, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  listCombos(page: number, limit: number): Observable<Page<Combo>> {
    return this.http.get<Page<Combo>>(`${this.base}/combos`, { params: this.pagination(page, limit) });
  }

  createCombo(body: ComboRequest, idempotencyKey: string): Observable<Combo> {
    return this.http.post<Combo>(`${this.base}/combos`, body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  listOrders(page: number, limit: number): Observable<Page<Order>> {
    return this.http.get<Page<Order>>(`${this.base}/orders`, { params: this.pagination(page, limit) });
  }

  createOrder(body: OrderRequest, idempotencyKey: string): Observable<Order> {
    return this.http.post<Order>(`${this.base}/orders`, body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.base}/orders/${encodeURIComponent(id)}`);
  }

  cancelOrder(id: string, idempotencyKey: string): Observable<void> {
    return this.http.post<void>(`${this.base}/orders/${encodeURIComponent(id)}/cancel`, null, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  adjustStock(body: StockAdjustment, idempotencyKey: string): Observable<void> {
    return this.http.post<void>(`${this.base}/stock/adjust`, body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  listStockMovements(page: number, limit: number): Observable<Page<StockMovement>> {
    return this.http.get<Page<StockMovement>>(`${this.base}/stock/movements`, {
      params: this.pagination(page, limit),
    });
  }

  private pagination(page: number, limit: number): HttpParams {
    return new HttpParams().set('page', page).set('limit', limit);
  }
}
