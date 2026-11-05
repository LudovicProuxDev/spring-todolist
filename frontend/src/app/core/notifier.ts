import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiError } from './models';

/**
 * Message lisible a partir d'une erreur HTTP : le champ "message" du corps
 * ApiError renvoye par le backend quand il existe, sinon un message generique.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as Partial<ApiError> | null;
    if (body && typeof body.message === 'string' && body.message.length > 0) {
      return body.message;
    }
    if (error.status === 0) {
      return 'Serveur injoignable. Vérifiez que le backend est démarré.';
    }
  }
  return 'Une erreur inattendue est survenue.';
}

@Injectable({ providedIn: 'root' })
export class Notifier {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3000 });
  }

  error(error: unknown): void {
    this.snackBar.open(errorMessage(error), 'Fermer', { duration: 6000, panelClass: 'snack-error' });
  }
}
