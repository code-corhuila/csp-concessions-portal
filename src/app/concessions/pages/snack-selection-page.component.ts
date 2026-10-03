import { Component } from '@angular/core';
import { ConcessionsPlaceholderComponent } from '../components/concessions-placeholder.component';

@Component({
  selector: 'app-snack-selection-page',
  standalone: true,
  imports: [ConcessionsPlaceholderComponent],
  template: `<app-concessions-placeholder title="Snack selection" titleId="snack-selection-title" />`,
})
export class SnackSelectionPageComponent {}
