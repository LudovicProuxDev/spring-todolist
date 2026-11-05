import { provideHttpClient } from '@angular/common/http';
import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree, provideRouter } from '@angular/router';

import { fakeToken } from '../../../testing/tokens';
import { Role } from '../models';
import { adminGuard, authGuard, guestGuard } from './auth.guards';
import { TOKEN_STORAGE_KEY } from './auth.service';

describe('auth guards', () => {
  function runGuard(guard: CanActivateFn, roles: Role[] | null): boolean | string {
    localStorage.clear();
    if (roles) {
      localStorage.setItem(TOKEN_STORAGE_KEY, fakeToken('jdupont', roles));
    }
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideRouter([])] });
    const result = runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
      guard({} as never, {} as never),
    );
    return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : (result as boolean);
  }

  it('authGuard should let an authenticated user through', () => {
    expect(runGuard(authGuard, ['ROLE_USER'])).toBe(true);
  });

  it('authGuard should redirect an anonymous user to /login', () => {
    expect(runGuard(authGuard, null)).toBe('/login');
  });

  it('adminGuard should let an admin through', () => {
    expect(runGuard(adminGuard, ['ROLE_USER', 'ROLE_ADMIN'])).toBe(true);
  });

  it('adminGuard should redirect a non-admin to /tasks', () => {
    expect(runGuard(adminGuard, ['ROLE_USER'])).toBe('/tasks');
  });

  it('adminGuard should redirect an anonymous user to /login', () => {
    expect(runGuard(adminGuard, null)).toBe('/login');
  });

  it('guestGuard should let an anonymous user through', () => {
    expect(runGuard(guestGuard, null)).toBe(true);
  });

  it('guestGuard should redirect an authenticated user to /tasks', () => {
    expect(runGuard(guestGuard, ['ROLE_USER'])).toBe('/tasks');
  });
});
