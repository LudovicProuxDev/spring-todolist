import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { fakeToken } from '../testing/tokens';
import { App } from './app';
import { TOKEN_STORAGE_KEY } from './core/auth/auth.service';
import { Role } from './core/models';
import { Notifier } from './core/notifier';

describe('App', () => {
  async function render(roles: Role[] | null, expiresInSeconds = 3600) {
    localStorage.clear();
    if (roles) {
      localStorage.setItem(TOKEN_STORAGE_KEY, fakeToken('jdupont', roles, expiresInSeconds));
    }
    TestBed.configureTestingModule({
      imports: [App],
      // Route generique : les clics sur les liens et la deconnexion naviguent sans erreur.
      providers: [provideRouter([{ path: '**', children: [] }]), provideHttpClient()],
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function navLabels(element: HTMLElement): string[] {
    return Array.from(element.querySelectorAll('a.nav-link')).map((link) => link.textContent!.trim());
  }

  async function click(fixture: ComponentFixture<App>, selector: string) {
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(selector)!.click();
    await fixture.whenStable();
  }

  it('should show only the app name when logged out (no tabs, no user menu)', async () => {
    const { element } = await render(null);

    expect(navLabels(element)).toEqual([]);
    expect(element.querySelector('.dropdown-toggle')).toBeNull();
    expect(element.querySelector('.navbar-toggler')).toBeNull();
    expect(element.querySelector('nav')?.textContent?.trim()).toBe('Todolist');
  });

  it('should show nothing of the user with an expired token', async () => {
    const { element } = await render(['ROLE_USER', 'ROLE_ADMIN'], -60);

    expect(navLabels(element)).toEqual([]);
    expect(element.textContent).not.toContain('jdupont');
  });

  it('should show the user navigation without the admin link', async () => {
    const { element } = await render(['ROLE_USER']);

    expect(navLabels(element)).toEqual(['Tâches', 'Catégories']);
    expect(element.querySelector('.dropdown-toggle')?.textContent).toContain('jdupont');
  });

  it('should show the admin link to administrators', async () => {
    const { element } = await render(['ROLE_USER', 'ROLE_ADMIN']);

    expect(navLabels(element)).toEqual(['Tâches', 'Catégories', 'Utilisateurs']);
  });

  it('should open the user menu, and close it on an outside click', async () => {
    const { fixture, element } = await render(['ROLE_USER']);
    const menu = () => element.querySelector('.dropdown-menu')!;

    await click(fixture, '.dropdown-toggle');
    expect(menu().classList).toContain('show');

    await click(fixture, 'main');
    expect(menu().classList).not.toContain('show');
  });

  it('should toggle the collapsed navigation on small screens', async () => {
    const { fixture, element } = await render(['ROLE_USER']);
    const collapse = () => element.querySelector('.navbar-collapse')!;

    await click(fixture, '.navbar-toggler');
    expect(collapse().classList).toContain('show');

    await click(fixture, 'a.nav-link');
    expect(collapse().classList).not.toContain('show');
  });

  it('should log out from the user menu', async () => {
    const { fixture, element } = await render(['ROLE_USER']);

    await click(fixture, '.dropdown-toggle');
    const logout = Array.from(element.querySelectorAll<HTMLButtonElement>('.dropdown-item')).find(
      (item) => item.textContent!.trim() === 'Se déconnecter',
    )!;
    logout.click();
    await fixture.whenStable();

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(navLabels(element)).toEqual([]);
  });

  it('should display the notifications', async () => {
    const { fixture, element } = await render(null);

    TestBed.inject(Notifier).success('Tâche créée');
    await fixture.whenStable();

    expect(element.querySelector('.toast')?.textContent).toContain('Tâche créée');
  });
});
