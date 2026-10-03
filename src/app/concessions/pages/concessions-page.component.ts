import { Component } from '@angular/core';
import { ConcessionsPlaceholderComponent } from '../components/concessions-placeholder.component';

@Component({
  selector: 'app-concessions-page',
  standalone: true,
  imports: [ConcessionsPlaceholderComponent],
  template: `<app-concessions-placeholder title="Concessions" titleId="concessions-title" />`,
})
export class ConcessionsPageComponent {}
