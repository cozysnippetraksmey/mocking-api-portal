import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/users',
    pathMatch: 'full'
  },
  {
    path: 'users',
    loadComponent: () => import('./features/mockings/components/user-management.component').then(m => m.UserManagementComponent)
  },
  {
    path: '**',
    redirectTo: '/users'
  }
];
