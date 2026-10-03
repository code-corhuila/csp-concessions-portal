import { Component } from '@angular/core';
import { ConcessionsPlaceholderComponent } from '../components/concessions-placeholder.component';

@Component({
  selector: 'app-combos-page',
  standalone: true,
  imports: [ConcessionsPlaceholderComponent],
  template: `<app-concessions-placeholder title="Concession combos" titleId="combos-title" />`,
})
export class CombosPageComponent {}
