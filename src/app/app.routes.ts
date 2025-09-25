import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/mocking-portal.component').then(m => m.MockingPortalComponent)
  },
  {
    path: 'portal',
    loadComponent: () => import('./components/mocking-portal.component').then(m => m.MockingPortalComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
