import { Routes } from '@angular/router';

export const CONCESSIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/concessions-page.component').then(m => m.ConcessionsPageComponent),
  },
  {
    path: 'snack-selection',
    loadComponent: () => import('./pages/snack-selection-page.component').then(m => m.SnackSelectionPageComponent),
  },
  {
    path: 'products',
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
];
