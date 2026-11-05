import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let login: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    login = vi.fn();
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: { login } }],
    });
  });

  function fill(username: string, password: string) {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const [usernameInput, passwordInput] = Array.from(element.querySelectorAll('input'));
    usernameInput.value = username;
    usernameInput.dispatchEvent(new Event('input'));
    passwordInput.value = password;
    passwordInput.dispatchEvent(new Event('input'));
    return { fixture, element };
  }

  it('should log in and go to /tasks', () => {
    login.mockReturnValue(of(undefined));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const { element } = fill('jdupont', 'secret123');

    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    expect(login).toHaveBeenCalledWith({ username: 'jdupont', password: 'secret123' });
    expect(navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it('should show the API error message', async () => {
    login.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, error: { status: 401, message: 'Identifiants invalides' } })),
    );
    const { fixture, element } = fill('jdupont', 'mauvais');

    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Identifiants invalides');
  });

  it('should not call the API when fields are empty', () => {
    const { element } = fill('', '');

    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    expect(login).not.toHaveBeenCalled();
  });
});
