import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { ERROR_DURATION_MS, Notifier, SUCCESS_DURATION_MS, Toasts, errorMessage } from './notifier';

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
  let notifier: Notifier;

  beforeEach(() => {
    vi.useFakeTimers();
    notifier = TestBed.inject(Notifier);
  });

  afterEach(() => vi.useRealTimers());

  it('should show a success message, then hide it after a short delay', () => {
    notifier.success('Tâche créée');

    expect(notifier.toasts()).toEqual([{ id: 1, kind: 'success', message: 'Tâche créée' }]);

    vi.advanceTimersByTime(SUCCESS_DURATION_MS);
    expect(notifier.toasts()).toEqual([]);
  });

  it('should show errors longer, with the API message', () => {
    notifier.error(new HttpErrorResponse({ status: 409, error: { message: 'Catégorie utilisée' } }));

    expect(notifier.toasts()).toEqual([{ id: 1, kind: 'error', message: 'Catégorie utilisée' }]);

    vi.advanceTimersByTime(SUCCESS_DURATION_MS);
    expect(notifier.toasts()).toHaveLength(1);

    vi.advanceTimersByTime(ERROR_DURATION_MS - SUCCESS_DURATION_MS);
    expect(notifier.toasts()).toEqual([]);
  });

  it('should stack messages and dismiss one on demand', () => {
    notifier.success('Un');
    notifier.success('Deux');

    notifier.dismiss(1);

    expect(notifier.toasts().map((toast) => toast.message)).toEqual(['Deux']);
  });
});

describe('Toasts', () => {
  async function render() {
    const fixture = TestBed.createComponent(Toasts);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement, notifier: TestBed.inject(Notifier) };
  }

  it('should render success and error toasts with the Bootstrap colours', async () => {
    const { fixture, element, notifier } = await render();

    notifier.success('Enregistré');
    notifier.error(new Error('boom'));
    await fixture.whenStable();

    const toasts = Array.from(element.querySelectorAll('.toast'));
    expect(toasts.map((toast) => toast.textContent!.trim())).toEqual(['Enregistré', 'Une erreur inattendue est survenue.']);
    expect(toasts[0].classList).toContain('text-bg-success');
    expect(toasts[1].classList).toContain('text-bg-danger');
    expect(toasts[1].getAttribute('role')).toBe('alert');
  });

  it('should close a toast with its close button', async () => {
    const { fixture, element, notifier } = await render();
    notifier.success('Enregistré');
    await fixture.whenStable();

    element.querySelector<HTMLButtonElement>('.btn-close')!.click();
    await fixture.whenStable();

    expect(element.querySelector('.toast')).toBeNull();
  });
});
