import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

/** Administration area (role ADMIN), mounted at /admin/concessions. The customer screen is in snack.routes.ts (ADR-027). */
export const CONCESSIONS_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'products' },
      {
        path: 'products',
        title: 'Productos',
        loadComponent: () => import('./pages/products-page.component').then(m => m.ProductsPageComponent),
      },
      {
        path: 'combos',
        loadComponent: () => import('./pages/combos-page.component').then(m => m.CombosPageComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders-page.component').then(m => m.OrdersPageComponent),
      },
      {
        path: 'inventory',
        loadComponent: () => import('./pages/inventory-page.component').then(m => m.InventoryPageComponent),
      },
    ],
  },
];
