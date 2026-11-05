import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { fakeToken } from '../testing/tokens';
import { App } from './app';
import { TOKEN_STORAGE_KEY } from './core/auth/auth.service';
import { Role } from './core/models';

describe('App', () => {
  async function render(roles: Role[] | null): Promise<HTMLElement> {
    localStorage.clear();
    if (roles) {
      localStorage.setItem(TOKEN_STORAGE_KEY, fakeToken('jdupont', roles));
    }
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient()],
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  function navLabels(element: HTMLElement): string[] {
    return Array.from(element.querySelectorAll('.nav a')).map((link) => link.textContent!.trim());
  }

  it('should hide the navigation when logged out', async () => {
    const element = await render(null);

    expect(navLabels(element)).toEqual([]);
  });

  it('should show the user navigation without the admin link', async () => {
    const element = await render(['ROLE_USER']);

    expect(navLabels(element)).toEqual(['Tâches', 'Catégories']);
    expect(element.textContent).toContain('jdupont');
  });

  it('should show the admin link to administrators', async () => {
    const element = await render(['ROLE_USER', 'ROLE_ADMIN']);

    expect(navLabels(element)).toEqual(['Tâches', 'Catégories', 'Utilisateurs']);
  });
});
