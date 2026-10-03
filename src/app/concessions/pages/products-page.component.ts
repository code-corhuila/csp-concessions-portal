import { Component } from '@angular/core';
import { ConcessionsPlaceholderComponent } from '../components/concessions-placeholder.component';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [ConcessionsPlaceholderComponent],
  template: `<app-concessions-placeholder title="Concession products" titleId="products-title" />`,
})
export class ProductsPageComponent {}
