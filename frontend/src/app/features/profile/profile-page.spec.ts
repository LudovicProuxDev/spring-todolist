import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { notifierMock } from '../../../testing/mocks';
import { UserService } from '../../core/api/api.services';
import { User } from '../../core/models';
import { ProfilePage } from './profile-page';

describe('ProfilePage', () => {
  const me: User = {
    id: 7,
    username: 'jdupont',
    firstname: 'Jean',
    lastname: null,
    email: 'jean@example.com',
    roles: ['ROLE_USER'],
  };

  let userService: { me: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };

  async function render() {
    userService = { me: vi.fn(() => of(me)), update: vi.fn((_id, request) => of({ ...me, ...request })) };
    const { notifier, provider } = notifierMock();
    TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [{ provide: UserService, useValue: userService }, provider],
    });
    const fixture = TestBed.createComponent(ProfilePage);
    await fixture.whenStable();
    const component = fixture.componentInstance as unknown as { form: any; save(user: User): void };
    return { element: fixture.nativeElement as HTMLElement, component, notifier };
  }

  it('should show the current profile and roles', async () => {
    const { element, component } = await render();

    expect(element.querySelector('mat-card-title')?.textContent).toContain('jdupont');
    expect(element.textContent).toContain('Utilisateur');
    expect(component.form.getRawValue()).toEqual({
      firstname: 'Jean',
      lastname: '',
      email: 'jean@example.com',
      password: '',
    });
  });

  it('should send a partial update without roles, keeping an empty password unchanged', async () => {
    const { component, notifier } = await render();
    component.form.patchValue({ lastname: ' Dupont ' });

    component.save(me);

    expect(userService.update).toHaveBeenCalledWith(7, {
      firstname: 'Jean',
      lastname: 'Dupont',
      email: 'jean@example.com',
      password: null,
    });
    expect(notifier.success).toHaveBeenCalledWith('Profil mis à jour');
  });

  it('should refuse a too short new password', async () => {
    const { component } = await render();
    component.form.patchValue({ password: 'court' });

    component.save(me);

    expect(userService.update).not.toHaveBeenCalled();
  });

  it('should report an API error (e.g. email already used)', async () => {
    const { component, notifier } = await render();
    const conflict = new HttpErrorResponse({ status: 409, error: { message: 'Email deja utilise' } });
    userService.update.mockReturnValue(throwError(() => conflict));

    component.save(me);

    expect(notifier.error).toHaveBeenCalledWith(conflict);
  });

  it('should report an error when the profile cannot be loaded', async () => {
    const error = new HttpErrorResponse({ status: 0 });
    TestBed.overrideProvider(UserService, { useValue: { me: () => throwError(() => error) } });
    const { element, notifier } = await render();

    expect(notifier.error).toHaveBeenCalledWith(error);
    expect(element.querySelector('mat-progress-bar')).toBeNull();
    expect(element.querySelector('form')).toBeNull();
  });
});
