import { Routes } from '@angular/router';

/**
 * Customer step of the purchase flow (role CLIENT). The shell mounts it at /booking/snack-selection,
 * as csp-docs/12-ux-ui/navigation-map.md documents (ADR-027).
 */
export const SNACK_ROUTES: Routes = [
  {
    path: '',
    title: 'Selección de snacks',
    loadComponent: () => import('./pages/snack-selection-page.component').then(m => m.SnackSelectionPageComponent),
  },
];
