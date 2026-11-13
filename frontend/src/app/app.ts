import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth/auth.service';
import { Toasts } from './core/notifier';

/**
 * Shell : barre de navigation Bootstrap. Le menu replie (petit ecran) et le
 * menu utilisateur sont ouverts/fermes par des signaux, sans le JavaScript
 * de Bootstrap.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toasts],
  templateUrl: './app.html',
  host: { '(document:click)': 'closeUserMenuOnOutsideClick($event)' },
})
export class App {
  protected readonly auth = inject(AuthService);

  protected readonly navOpen = signal(false);
  protected readonly userMenuOpen = signal(false);

  toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  closeMenus(): void {
    this.navOpen.set(false);
    this.userMenuOpen.set(false);
  }

  logout(): void {
    this.closeMenus();
    this.auth.logout();
  }

  protected closeUserMenuOnOutsideClick(event: Event): void {
    if (!(event.target instanceof Element) || !event.target.closest('.dropdown')) {
      this.userMenuOpen.set(false);
    }
  }
}
