import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Frame of the administration area (role ADMIN): the three screens of /admin/concessions. */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  styleUrl: '../pages/admin-page.css',
  template: `
    <nav class="admin-nav" aria-label="Concessions">
      <a routerLink="products" routerLinkActive="active">Productos</a>
      <a routerLink="combos" routerLinkActive="active">Combos</a>
      <a routerLink="inventory" routerLinkActive="active">Inventario</a>
    </nav>
    <router-outlet />
  `,
})
export class AdminLayoutComponent {}
