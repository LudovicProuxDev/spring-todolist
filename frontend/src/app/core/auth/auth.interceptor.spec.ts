import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { fakeToken } from '../../../testing/tokens';
import { authInterceptor } from './auth.interceptor';
import { AuthService, TOKEN_STORAGE_KEY } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  function setUp(token: string | null): void {
    localStorage.clear();
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  }

  afterEach(() => backend.verify());

  it('should add the bearer token to API calls', () => {
    const token = fakeToken('jdupont');
    setUp(token);

    http.get('/api/users/me').subscribe();

    const request = backend.expectOne('/api/users/me');
    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    request.flush({});
  });

  it('should not add a token to /api/auth calls', () => {
    setUp(fakeToken('jdupont'));

    http.post('/api/auth/login', {}).subscribe();

    const request = backend.expectOne('/api/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('should not add a token when not authenticated', () => {
    setUp(null);

    http.get('/api/tasks').subscribe();

    const request = backend.expectOne('/api/tasks');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });

  it('should log out when an authenticated call returns 401', () => {
    setUp(fakeToken('jdupont'));
    const logout = vi.spyOn(TestBed.inject(AuthService), 'logout').mockImplementation(() => undefined);
    let failed = false;

    http.get('/api/users/me').subscribe({ error: () => (failed = true) });
    backend.expectOne('/api/users/me').flush({ status: 401 }, { status: 401, statusText: 'Unauthorized' });

    expect(logout).toHaveBeenCalled();
    expect(failed).toBe(true);
  });

  it('should not log out on 403', () => {
    setUp(fakeToken('jdupont'));
    const logout = vi.spyOn(TestBed.inject(AuthService), 'logout');

    http.get('/api/users').subscribe({ error: () => undefined });
    backend.expectOne('/api/users').flush({ status: 403 }, { status: 403, statusText: 'Forbidden' });

    expect(logout).not.toHaveBeenCalled();
  });
});
