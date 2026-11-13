import { HttpErrorResponse } from '@angular/common/http';
import { Component, Injectable, inject, signal } from '@angular/core';

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

export interface Toast {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

export const SUCCESS_DURATION_MS = 3000;
export const ERROR_DURATION_MS = 6000;

/** Notifications affichees en "toasts" Bootstrap par le composant Toasts. */
@Injectable({ providedIn: 'root' })
export class Notifier {
  private nextId = 0;
  private readonly items = signal<Toast[]>([]);

  readonly toasts = this.items.asReadonly();

  success(message: string): void {
    this.show('success', message, SUCCESS_DURATION_MS);
  }

  error(error: unknown): void {
    this.show('error', errorMessage(error), ERROR_DURATION_MS);
  }

  dismiss(id: number): void {
    this.items.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private show(kind: Toast['kind'], message: string, durationMs: number): void {
    const id = ++this.nextId;
    this.items.update((toasts) => [...toasts, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }
}

/** Pile de toasts en bas a droite de l'ecran, placee une seule fois dans le shell. */
@Component({
  selector: 'app-toasts',
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
      @for (toast of notifier.toasts(); track toast.id) {
        <div
          class="toast show align-items-center border-0"
          [class.text-bg-success]="toast.kind === 'success'"
          [class.text-bg-danger]="toast.kind === 'error'"
          [attr.role]="toast.kind === 'error' ? 'alert' : 'status'"
          aria-atomic="true"
        >
          <div class="d-flex">
            <div class="toast-body">{{ toast.message }}</div>
            <button
              type="button"
              class="btn-close btn-close-white me-2 m-auto"
              aria-label="Fermer"
              (click)="notifier.dismiss(toast.id)"
            ></button>
          </div>
        </div>
      }
    </div>
  `,
})
export class Toasts {
  protected readonly notifier = inject(Notifier);
}
