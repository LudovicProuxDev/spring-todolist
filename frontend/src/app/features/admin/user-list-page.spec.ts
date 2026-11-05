import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { dialogMock, notifierMock } from '../../../testing/mocks';
import { UserService } from '../../core/api/api.services';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models';
import { UserDialog } from './user-dialog';
import { UserListPage } from './user-list-page';

describe('UserListPage', () => {
  const admin: User = { id: 1, username: 'admin', firstname: null, lastname: null, email: 'a@example.com', roles: ['ROLE_USER', 'ROLE_ADMIN'] };
  const marie: User = { id: 2, username: 'marie', firstname: 'Marie', lastname: 'Curie', email: 'm@example.com', roles: ['ROLE_USER'] };

  let userService: Record<'findAll' | 'create' | 'update' | 'delete', ReturnType<typeof vi.fn>>;

  async function render(...dialogResults: unknown[]) {
    userService = {
      findAll: vi.fn(() => of([marie, admin])),
      create: vi.fn((request) => of({ ...marie, id: 3, username: request.username })),
      update: vi.fn(() => of(marie)),
      delete: vi.fn(() => of(undefined)),
    };
    const dialog = dialogMock(...dialogResults);
    const { notifier, provider } = notifierMock();
    TestBed.configureTestingModule({
      imports: [UserListPage],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: { username: signal('admin') } },
        dialog.provider,
        provider,
      ],
    });
    const fixture = TestBed.createComponent(UserListPage);
    await fixture.whenStable();
    return { element: fixture.nativeElement as HTMLElement, component: fixture.componentInstance, dialog, notifier };
  }

  function rows(element: HTMLElement): HTMLElement[] {
    return Array.from(element.querySelectorAll('tr.mat-mdc-row'));
  }

  it('should list users sorted by username, with names and roles', async () => {
    const { element } = await render();

    const [adminRow, marieRow] = rows(element);
    expect(adminRow.textContent).toContain('(vous)');
    expect(adminRow.textContent).toContain('Administrateur');
    expect(marieRow.textContent).toContain('Marie Curie');
  });

  it('should disable deleting your own account only', async () => {
    const { element } = await render();

    const deleteButtons = rows(element).map(
      (row) => row.querySelector<HTMLButtonElement>('button[aria-label="Supprimer"]')!,
    );
    expect(deleteButtons.map((button) => button.disabled)).toEqual([true, false]);
  });

  it('should create a user from the dialog', async () => {
    const request = { username: 'paul', password: 'secret123', email: 'p@example.com', firstname: null, lastname: null };
    const { component, dialog, notifier } = await render({ kind: 'create', request });

    component.openDialog();

    expect(dialog.open).toHaveBeenCalledWith(UserDialog, expect.objectContaining({ data: null }));
    expect(userService.create).toHaveBeenCalledWith(request);
    expect(notifier.success).toHaveBeenCalledWith('paul créé');
  });

  it('should update the edited user', async () => {
    const request = { roles: ['ROLE_USER', 'ROLE_ADMIN'] };
    const { component, notifier } = await render({ kind: 'update', request });

    component.openDialog(marie);

    expect(userService.update).toHaveBeenCalledWith(2, request);
    expect(notifier.success).toHaveBeenCalledWith('marie modifié');
  });

  it('should warn that your own roles change at the next login', async () => {
    const { component, notifier } = await render({ kind: 'update', request: { roles: ['ROLE_ADMIN'] } });
    userService.update.mockReturnValue(of(admin));

    component.openDialog(admin);

    expect(notifier.success).toHaveBeenCalledWith(expect.stringContaining('prochaine connexion'));
  });

  it('should delete a user after confirmation', async () => {
    const { component } = await render(true);

    component.remove(marie);

    expect(userService.delete).toHaveBeenCalledWith(2);
  });

  it('should not delete when the confirmation is refused', async () => {
    const { component } = await render(false);

    component.remove(marie);

    expect(userService.delete).not.toHaveBeenCalled();
  });

  it('should report an error when users cannot be loaded (e.g. 403)', async () => {
    const error = new HttpErrorResponse({ status: 403 });
    TestBed.overrideProvider(UserService, { useValue: { findAll: () => throwError(() => error) } });
    const { notifier } = await render();

    expect(notifier.error).toHaveBeenCalledWith(error);
  });
});
