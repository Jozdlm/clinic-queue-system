import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Reports } from './pages/reports/reports';
import { Tickets } from './pages/tickets/tickets';
import { adminGuard } from './modules/auth/admin-guard';
import { frontDeskGuard } from './modules/auth/front-desk-guard';
import { authGuard } from './modules/auth/auth-guard';
import { guestGuard } from './modules/auth/guest-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth/login',
    component: Login,
    canActivate: [guestGuard],
  },
  {
    path: 'app',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'tickets', pathMatch: 'full' },
      { path: 'tickets', component: Tickets, canActivate: [frontDeskGuard] },
      { path: 'reports', component: Reports, canActivate: [adminGuard] },
    ],
  },
];
