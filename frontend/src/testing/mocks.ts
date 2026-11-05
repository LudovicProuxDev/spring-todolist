import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { Notifier } from '../app/core/notifier';

/**
 * MatDialog factice : chaque open() renvoie, a la fermeture, la valeur
 * suivante de la file "results" (undefined = dialogue annule).
 */
export function dialogMock(...results: unknown[]) {
  const queue = [...results];
  const open = vi.fn(() => ({ afterClosed: () => of(queue.shift()) }));
  return { open, provider: { provide: MatDialog, useValue: { open } } };
}

export function notifierMock() {
  const notifier = { success: vi.fn(), error: vi.fn() };
  return { notifier, provider: { provide: Notifier, useValue: notifier } };
}
