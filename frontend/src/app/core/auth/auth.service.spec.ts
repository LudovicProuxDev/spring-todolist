import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { fakeToken } from '../../../testing/tokens';
import { AuthService, TOKEN_STORAGE_KEY, decodeToken } from './auth.service';

describe('decodeToken', () => {
  it('should read subject, roles and expiration', () => {
    const payload = decodeToken(fakeToken('jdupont', ['ROLE_USER', 'ROLE_ADMIN']));

    expect(payload?.sub).toBe('jdupont');
    expect(payload?.roles).toEqual(['ROLE_USER', 'ROLE_ADMIN']);
    expect(payload?.exp).toBeGreaterThan(Date.now() / 1000);
  });

  it('should return null for a malformed token', () => {
    expect(decodeToken('pas-un-jwt')).toBeNull();
    expect(decodeToken('a.b.c')).toBeNull();
  });

  it('should return null when the payload has no subject or expiry', () => {
    const payload = btoa(JSON.stringify({ roles: ['ROLE_USER'] }));
    expect(decodeToken(`header.${payload}.signature`)).toBeNull();
  });

  it('should default to no roles when the claim is missing', () => {
    const payload = btoa(JSON.stringify({ sub: 'jdupont', exp: 9999999999 }));
    expect(decodeToken(`header.${payload}.signature`)?.roles).toEqual([]);
  });
});

describe('AuthService', () => {
  let http: HttpTestingController;

  function createService(): AuthService {
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should not be authenticated without a token', () => {
    const auth = createService();

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.getToken()).toBeNull();
    expect(auth.username()).toBeNull();
  });

  it('should store the token returned by login', () => {
    const auth = createService();
    const token = fakeToken('jdupont');

    auth.login({ username: 'jdupont', password: 'secret123' }).subscribe();
    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ username: 'jdupont', password: 'secret123' });
    request.flush({ token });

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.getToken()).toBe(token);
    expect(auth.username()).toBe('jdupont');
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe(token);
  });

  it('should restore a stored token', () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, fakeToken('jdupont', ['ROLE_USER', 'ROLE_ADMIN']));

    const auth = createService();

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.isAdmin()).toBe(true);
  });

  it('should ignore an expired token', () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, fakeToken('jdupont', ['ROLE_USER'], -60));

    const auth = createService();

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.getToken()).toBeNull();
  });

  it('should not be admin with ROLE_USER only', () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, fakeToken('jdupont', ['ROLE_USER']));

    expect(createService().isAdmin()).toBe(false);
  });

  it('should clear the token and go to /login on logout', () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, fakeToken('jdupont'));
    const auth = createService();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should post registration data', () => {
    const auth = createService();
    const body = { username: 'jdupont', password: 'secret123', email: 'j@example.com', firstname: null, lastname: null };

    auth.register(body).subscribe();

    const request = http.expectOne('/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush({});
  });
});
