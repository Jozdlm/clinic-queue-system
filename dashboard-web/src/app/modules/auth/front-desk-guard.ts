import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const frontDeskGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const role = localStorage.getItem('role');

  if (role !== 'staff') {
    router.navigate(['/app/reports']);
    return false;
  }

  return true;
};
