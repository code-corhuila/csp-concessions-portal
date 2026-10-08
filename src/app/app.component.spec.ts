import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('creates the root component', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).createComponent(AppComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
