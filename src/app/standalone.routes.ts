import { Routes } from '@angular/router';
import { CONCESSIONS_ROUTES } from './concessions/concessions.routes';
import { SNACK_ROUTES } from './concessions/snack.routes';

/**
 * Standalone runs only. Mounts the two federated entries at the addresses the shell uses
 * (navigation-map.md, ADR-027) and sends the start address to the customer step, so the portal
 * can be tried alone.
 */
export const STANDALONE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'booking/snack-selection' },
  { path: 'booking/snack-selection', children: SNACK_ROUTES },
  { path: 'admin/concessions', children: CONCESSIONS_ROUTES },
];
