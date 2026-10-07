import { Routes } from '@angular/router';
import { CONCESSIONS_ROUTES } from './concessions/concessions.routes';

/**
 * Standalone runs only. Mounts the portal under /concessions, as the shell mounts it under its
 * own prefix, and sends the start address to the customer step so the portal can be tried alone.
 */
export const STANDALONE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'concessions/snack-selection' },
  { path: 'concessions', children: CONCESSIONS_ROUTES },
];
