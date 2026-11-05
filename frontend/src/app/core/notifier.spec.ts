import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Notifier, errorMessage } from './notifier';

describe('errorMessage', () => {
  it('should use the message of the ApiError body', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { timestamp: '2026-11-05T10:00:00Z', status: 409, message: 'Catégorie utilisée' },
    });

    expect(errorMessage(error)).toBe('Catégorie utilisée');
  });

  it('should explain when the server cannot be reached', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain('injoignable');
  });

  it('should fall back to a generic message', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 500, error: 'boom' }))).toBe(
      'Une erreur inattendue est survenue.',
    );
    expect(errorMessage(new Error('boom'))).toBe('Une erreur inattendue est survenue.');
  });
});

describe('Notifier', () => {
  let open: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    open = vi.fn();
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: { open } }] });
  });

  it('should show success messages briefly', () => {
    TestBed.inject(Notifier).success('Tâche créée');

    expect(open).toHaveBeenCalledWith('Tâche créée', 'OK', { duration: 3000 });
  });

  it('should show errors longer, with the error style and the API message', () => {
    const error = new HttpErrorResponse({ status: 409, error: { message: 'Catégorie utilisée' } });

    TestBed.inject(Notifier).error(error);

    expect(open).toHaveBeenCalledWith('Catégorie utilisée', 'Fermer', { duration: 6000, panelClass: 'snack-error' });
  });
});
