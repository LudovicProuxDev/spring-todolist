import { Routes } from '@angular/router';

import { adminGuard, authGuard, guestGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  {
    path: 'login',
    title: 'Connexion',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    title: 'Inscription',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register-page').then((m) => m.RegisterPage),
  },
  {
    path: 'tasks',
    title: 'Tâches',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tasks/task-list-page').then((m) => m.TaskListPage),
  },
  {
    path: 'categories',
    title: 'Catégories',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/categories/category-list-page').then((m) => m.CategoryListPage),
  },
  {
    path: 'profile',
    title: 'Mon profil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile-page').then((m) => m.ProfilePage),
  },
  {
    path: 'admin/users',
    title: 'Utilisateurs',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/user-list-page').then((m) => m.UserListPage),
  },
  { path: '**', redirectTo: 'tasks' },
];
