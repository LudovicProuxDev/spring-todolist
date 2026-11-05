import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationInitStatus, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';

import { fakeToken } from '../testing/tokens';
import { appConfig } from './app.config';
import { TOKEN_STORAGE_KEY } from './core/auth/auth.service';

describe('appConfig', () => {
  beforeEach(async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, fakeToken('jdupont'));
    TestBed.configureTestingModule({ providers: [...appConfig.providers, provideHttpClientTesting()] });
    await TestBed.inject(ApplicationInitStatus).donePromise;
  });

  afterEach(() => localStorage.clear());

  it('should use the French locale', () => {
    expect(TestBed.inject(LOCALE_ID)).toBe('fr-FR');
  });

  it('should make <mat-icon> use the Material Symbols font loaded by index.html', () => {
    expect(TestBed.inject(MatIconRegistry).getDefaultFontSetClass()).toContain('material-symbols-outlined');
  });

  it('should register the auth interceptor on the HTTP client', () => {
    TestBed.inject(HttpClient).get('/api/users/me').subscribe();

    const request = TestBed.inject(HttpTestingController).expectOne('/api/users/me');
    expect(request.request.headers.get('Authorization')).toMatch(/^Bearer /);
    request.flush({});
  });
});
