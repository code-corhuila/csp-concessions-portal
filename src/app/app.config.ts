import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { STANDALONE_ROUTES } from './standalone.routes';

/**
 * Standalone runs only. Inside the shell the portal uses the shell's client, which also provides the
 * authentication interceptor; here the client has none, so the administration calls reach the API without a
 * token and are answered 401 until the portal runs inside the shell.
 */
export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideRouter(STANDALONE_ROUTES), provideHttpClient()],
};
