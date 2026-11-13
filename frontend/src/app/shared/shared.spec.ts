import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { dialogMock } from '../../testing/mocks';
import { ConfirmDialog, confirm } from './confirm-dialog';
import { RoleLabelPipe } from './role-label.pipe';
import { Spinner } from './spinner';

describe('RoleLabelPipe', () => {
  it('should translate known roles', () => {
    const pipe = new RoleLabelPipe();

    expect(pipe.transform('ROLE_USER')).toBe('Utilisateur');
    expect(pipe.transform('ROLE_ADMIN')).toBe('Administrateur');
  });

  it('should fall back to the raw value for an unknown role', () => {
    expect(new RoleLabelPipe().transform('ROLE_AUTRE' as never)).toBe('ROLE_AUTRE');
  });
});

describe('confirm', () => {
  it.each([
    [true, true],
    [false, false],
    [undefined, false],
  ])('should emit %s -> %s', async (closedWith, expected) => {
    const dialog = dialogMock(closedWith);

    const result = await firstValueFrom(
      confirm({ open: dialog.open } as unknown as Dialog, { title: 'T', message: 'M' }),
    );

    expect(result).toBe(expected);
  });

  it('should open ConfirmDialog with the given data', () => {
    const dialog = dialogMock(true);
    const data = { title: 'Supprimer', message: 'Vraiment ?' };

    confirm({ open: dialog.open } as unknown as Dialog, data).subscribe();

    expect(dialog.open).toHaveBeenCalledWith(ConfirmDialog, expect.objectContaining({ data }));
  });
});

describe('ConfirmDialog', () => {
  async function render(data: object) {
    const close = vi.fn();
    TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: { close } },
      ],
    });
    const fixture = TestBed.createComponent(ConfirmDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(element.querySelectorAll('button'));
    return { element, buttons, close };
  }

  it('should render the title, message and confirm label', async () => {
    const { element, buttons } = await render({ title: 'Titre', message: 'Message', confirmLabel: 'Oui' });

    expect(element.querySelector('.modal-title')?.textContent).toContain('Titre');
    expect(element.querySelector('.modal-body')?.textContent).toContain('Message');
    expect(buttons.map((b) => b.textContent!.trim())).toEqual(['Annuler', 'Oui']);
  });

  it('should default the confirm label to "Supprimer"', async () => {
    const { buttons } = await render({ title: 'T', message: 'M' });

    expect(buttons[1].textContent).toContain('Supprimer');
  });

  it('should close with true on confirm and false on cancel', async () => {
    const { buttons, close } = await render({ title: 'T', message: 'M' });

    buttons[1].click();
    expect(close).toHaveBeenLastCalledWith(true);

    buttons[0].click();
    expect(close).toHaveBeenLastCalledWith(false);
  });
});

describe('Spinner', () => {
  it('should render an accessible Bootstrap spinner', async () => {
    const fixture = TestBed.createComponent(Spinner);
    await fixture.whenStable();
    const spinner = (fixture.nativeElement as HTMLElement).querySelector('.spinner-border');

    expect(spinner?.getAttribute('role')).toBe('status');
    expect(spinner?.textContent).toContain('Chargement');
  });
});
