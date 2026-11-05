import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { RegisterPage } from './register-page';

describe('RegisterPage', () => {
  let auth: { register: ReturnType<typeof vi.fn>; login: ReturnType<typeof vi.fn> };

  async function render() {
    auth = { register: vi.fn(() => of({})), login: vi.fn(() => of(undefined)) };
    TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    const fixture = TestBed.createComponent(RegisterPage);
    await fixture.whenStable();
    const component = fixture.componentInstance as unknown as { form: any; submit(): void };
    return { fixture, element: fixture.nativeElement as HTMLElement, component };
  }

  const valid = { username: 'jdupont', email: 'jean@example.com', password: 'secret123', firstname: '', lastname: ' Dupont ' };

  it('should register, then log in with the same credentials and go to /tasks', async () => {
    const { component } = await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.form.setValue(valid);

    component.submit();

    expect(auth.register).toHaveBeenCalledWith({
      username: 'jdupont',
      email: 'jean@example.com',
      password: 'secret123',
      firstname: null,
      lastname: 'Dupont',
    });
    expect(auth.login).toHaveBeenCalledWith({ username: 'jdupont', password: 'secret123' });
    expect(navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it.each([
    ['a too short username', { username: 'jd' }],
    ['an invalid email', { email: 'pas-un-email' }],
    ['a too short password', { password: 'court' }],
  ])('should not call the API with %s', async (_label, override) => {
    const { component } = await render();
    component.form.setValue({ ...valid, ...override });

    component.submit();

    expect(auth.register).not.toHaveBeenCalled();
  });

  it('should show the API error and not log in (e.g. username taken)', async () => {
    const { fixture, element, component } = await render();
    auth.register.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { message: "Ce nom d'utilisateur est deja pris" } })),
    );
    component.form.setValue(valid);

    component.submit();
    await fixture.whenStable();

    expect(auth.login).not.toHaveBeenCalled();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('deja pris');
  });
});
