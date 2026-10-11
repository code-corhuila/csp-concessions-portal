import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-concessions-placeholder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [attr.aria-labelledby]="titleId()">
      <h1 [id]="titleId()">{{ title() }}</h1>
      <p role="status">This Concessions screen is ready for implementation.</p>
      <p class="sr-only">The screen will provide loading, error, empty and ready states.</p>
    </section>
  `,
})
export class ConcessionsPlaceholderComponent {
  readonly title = input.required<string>();
  readonly titleId = input.required<string>();
}
