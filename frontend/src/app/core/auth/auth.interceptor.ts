import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

/**
 * Ajoute "Authorization: Bearer <jeton>" aux appels vers /api (sauf
 * /api/auth, qui sert justement a obtenir le jeton). Un 401 sur une requete
 * qui portait un jeton signifie que la session n'est plus valide (jeton
 * expire, compte supprime) : on deconnecte et on renvoie vers /login.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  if (!token || !request.url.startsWith('/api/') || request.url.startsWith('/api/auth/')) {
    return next(request);
  }

  const authorized = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
