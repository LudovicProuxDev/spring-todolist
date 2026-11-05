import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { dialogMock } from '../../testing/mocks';
import { ConfirmDialog, confirm } from './confirm-dialog';
import { RoleLabelPipe } from './role-label.pipe';

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
      confirm({ open: dialog.open } as unknown as MatDialog, { title: 'T', message: 'M' }),
    );

    expect(result).toBe(expected);
  });

  it('should open ConfirmDialog with the given data', () => {
    const dialog = dialogMock(true);
    const data = { title: 'Supprimer', message: 'Vraiment ?' };

    confirm({ open: dialog.open } as unknown as MatDialog, data).subscribe();

    expect(dialog.open).toHaveBeenCalledWith(ConfirmDialog, expect.objectContaining({ data }));
  });
});

describe('ConfirmDialog', () => {
  it('should render the title, message and confirm label', async () => {
    TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: { title: 'Titre', message: 'Message', confirmLabel: 'Oui' } }],
    });
    const fixture = TestBed.createComponent(ConfirmDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[mat-dialog-title]')?.textContent).toContain('Titre');
    expect(element.textContent).toContain('Message');
    expect(Array.from(element.querySelectorAll('button')).map((b) => b.textContent!.trim())).toEqual(['Annuler', 'Oui']);
  });

  it('should default the confirm label to "Supprimer"', async () => {
    TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: { title: 'T', message: 'M' } }],
    });
    const fixture = TestBed.createComponent(ConfirmDialog);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Supprimer');
  });
});
