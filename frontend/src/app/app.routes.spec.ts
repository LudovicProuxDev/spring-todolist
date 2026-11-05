import { Type } from '@angular/core';
import { CanActivateFn, Route } from '@angular/router';

import { routes } from './app.routes';
import { adminGuard, authGuard, guestGuard } from './core/auth/auth.guards';
import { UserListPage } from './features/admin/user-list-page';
import { LoginPage } from './features/auth/login-page';
import { RegisterPage } from './features/auth/register-page';
import { CategoryListPage } from './features/categories/category-list-page';
import { ProfilePage } from './features/profile/profile-page';
import { TaskListPage } from './features/tasks/task-list-page';

describe('routes', () => {
  function route(path: string): Route {
    const found = routes.find((r) => r.path === path);
    expect(found, `route "${path}"`).toBeDefined();
    return found!;
  }

  it.each<[string, Type<unknown>, CanActivateFn]>([
    ['login', LoginPage, guestGuard],
    ['register', RegisterPage, guestGuard],
    ['tasks', TaskListPage, authGuard],
    ['categories', CategoryListPage, authGuard],
    ['profile', ProfilePage, authGuard],
    ['admin/users', UserListPage, adminGuard],
  ])('"%s" should lazy-load its page behind the right guard', async (path, component, guard) => {
    const config = route(path);

    expect(config.canActivate).toEqual([guard]);
    expect(await (config.loadComponent as () => Promise<Type<unknown>>)()).toBe(component);
    expect(config.title).toBeTruthy();
  });

  it('should protect every page except login and register', () => {
    const unprotected = routes
      .filter((r) => r.loadComponent && !r.canActivate?.some((g) => g === authGuard || g === adminGuard))
      .map((r) => r.path);

    expect(unprotected).toEqual(['login', 'register']);
  });

  it('should redirect the root and unknown paths to /tasks', () => {
    expect(route('')).toMatchObject({ redirectTo: 'tasks', pathMatch: 'full' });
    expect(route('**')).toMatchObject({ redirectTo: 'tasks' });
  });
});
