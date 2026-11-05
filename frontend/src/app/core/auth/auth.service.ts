import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';

import { AuthResponse, LoginRequest, Role, User, UserCreateRequest } from '../models';

export const TOKEN_STORAGE_KEY = 'todolist.token';

/** Contenu utile du JWT emis par le backend (JwtService). */
export interface TokenPayload {
  sub: string;
  roles: Role[];
  exp: number;
}

/**
 * Decode la partie "payload" d'un JWT, sans verifier la signature : c'est au
 * backend de le faire a chaque requete. Le front n'en tire que de quoi
 * adapter l'interface (nom affiche, menu admin, expiration).
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    const decoded = JSON.parse(json);
    if (typeof decoded.sub !== 'string' || typeof decoded.exp !== 'number') {
      return null;
    }
    return { sub: decoded.sub, roles: Array.isArray(decoded.roles) ? decoded.roles : [], exp: decoded.exp };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly token = signal<string | null>(this.readStoredToken());

  private readonly payload = computed(() => {
    const token = this.token();
    return token ? decodeToken(token) : null;
  });

  readonly username = computed(() => this.payload()?.sub ?? null);
  readonly isAdmin = computed(() => this.payload()?.roles.includes('ROLE_ADMIN') ?? false);

  /** Recalcule l'expiration a chaque appel : un signal ne "voit" pas le temps passer. */
  isAuthenticated(): boolean {
    const payload = this.payload();
    return payload !== null && payload.exp * 1000 > Date.now();
  }

  getToken(): string | null {
    return this.isAuthenticated() ? this.token() : null;
  }

  login(request: LoginRequest): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/login', request).pipe(
      tap((response) => this.storeToken(response.token)),
      map(() => undefined),
    );
  }

  register(request: UserCreateRequest): Observable<User> {
    return this.http.post<User>('/api/auth/register', request);
  }

  logout(): void {
    this.storeToken(null);
    this.router.navigate(['/login']);
  }

  private storeToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // Stockage indisponible (navigation privee stricte) : le jeton reste en memoire.
    }
    this.token.set(token);
  }

  private readStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }
}
