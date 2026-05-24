import {
  ApplicationConfig,
  InjectionToken,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { API_URL, WS_URL } from './di-tokens';
import { authInterceptor } from './modules/auth/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: API_URL, useValue: 'https://hospital-university-production.up.railway.app/api' },
    { provide: WS_URL, useValue: 'wss://hospital-university-production.up.railway.app/api' },
  ],
};
