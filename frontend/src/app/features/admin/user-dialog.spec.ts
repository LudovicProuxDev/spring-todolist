import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { User } from '../../core/models';
import { UserDialog } from './user-dialog';

describe('UserDialog', () => {
  let close: ReturnType<typeof vi.fn>;

  function create(user: User | null) {
    close = vi.fn();
    TestBed.configureTestingModule({
      imports: [UserDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: user },
        { provide: MatDialogRef, useValue: { close } },
      ],
    });
    const fixture = TestBed.createComponent(UserDialog);
    fixture.detectChanges();
    // Acces au formulaire protege, comme le ferait le template.
    return fixture.componentInstance as unknown as { form: any; save(): void };
  }

  const existing: User = {
    id: 7,
    username: 'jdupont',
    firstname: 'Jean',
    lastname: null,
    email: 'j@example.com',
    roles: ['ROLE_USER'],
  };

  it('should return a creation request without roles', () => {
    const dialog = create(null);
    dialog.form.patchValue({ username: ' marie ', email: 'm@example.com', password: 'secret123', lastname: '' });

    dialog.save();

    expect(close).toHaveBeenCalledWith({
      kind: 'create',
      request: { username: 'marie', password: 'secret123', email: 'm@example.com', firstname: null, lastname: null },
    });
  });

  it('should require a password on creation', () => {
    const dialog = create(null);
    dialog.form.patchValue({ username: 'marie', email: 'm@example.com' });

    dialog.save();

    expect(close).not.toHaveBeenCalled();
  });

  it('should return the checked roles on update and keep an empty password unchanged', () => {
    const dialog = create(existing);
    dialog.form.patchValue({ roles: { ROLE_ADMIN: true } });

    dialog.save();

    expect(close).toHaveBeenCalledWith({
      kind: 'update',
      request: {
        firstname: 'Jean',
        lastname: null,
        email: 'j@example.com',
        password: null,
        roles: ['ROLE_USER', 'ROLE_ADMIN'],
      },
    });
  });

  it('should refuse an update without any role', () => {
    const dialog = create(existing);
    dialog.form.patchValue({ roles: { ROLE_USER: false } });

    dialog.save();

    expect(close).not.toHaveBeenCalled();
  });
});
