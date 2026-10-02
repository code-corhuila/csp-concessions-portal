import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { CONCESSIONS_ROUTES } from './concessions/concessions.routes';

/**
 * The shell provides the shared HttpClient and its authentication interceptor.
 */
export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideRouter(CONCESSIONS_ROUTES)],
};
