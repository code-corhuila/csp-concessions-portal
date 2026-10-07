import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { STANDALONE_ROUTES } from './standalone.routes';

/**
 * Standalone runs only. Deliberately NO provideHttpClient(): inside the shell the portal uses the
 * shell's client, which also provides the authentication interceptor.
 */
export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideRouter(STANDALONE_ROUTES)],
};
