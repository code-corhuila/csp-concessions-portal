import { Component } from '@angular/core';
import { ConcessionsPlaceholderComponent } from '../components/concessions-placeholder.component';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [ConcessionsPlaceholderComponent],
  template: `<app-concessions-placeholder title="Concession inventory" titleId="inventory-title" />`,
})
export class InventoryPageComponent {}
