import { Dialog } from '@angular/cdk/dialog';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Observable, filter, switchMap } from 'rxjs';

import { UserService } from '../../core/api/api.services';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models';
import { Notifier } from '../../core/notifier';
import { confirm } from '../../shared/confirm-dialog';
import { RoleLabelPipe } from '../../shared/role-label.pipe';
import { Spinner } from '../../shared/spinner';
import { UserDialog, UserDialogResult } from './user-dialog';

@Component({
  selector: 'app-user-list-page',
  imports: [RoleLabelPipe, Spinner],
  template: `
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-2 mb-4 border-bottom">
      <h1 class="h3 mb-0">Utilisateurs</h1>
      <button class="btn btn-primary" type="button" (click)="openDialog()">Nouvel utilisateur</button>
    </div>

    @if (loading()) {
      <app-spinner />
    } @else {
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th scope="col">Utilisateur</th>
              <th scope="col">Nom</th>
              <th scope="col">Email</th>
              <th scope="col">Rôles</th>
              <th scope="col"><span class="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr>
                <td>
                  <strong>{{ user.username }}</strong>
                  @if (user.username === auth.username()) {
                    <span class="text-body-secondary"> (vous)</span>
                  }
                </td>
                <td>{{ fullName(user) }}</td>
                <td>{{ user.email }}</td>
                <td>
                  @for (role of user.roles; track role) {
                    <span
                      class="badge me-1"
                      [class.text-bg-primary]="role === 'ROLE_ADMIN'"
                      [class.text-bg-secondary]="role !== 'ROLE_ADMIN'"
                    >
                      {{ role | roleLabel }}
                    </span>
                  }
                </td>
                <td class="text-end text-nowrap">
                  <button class="btn btn-sm btn-outline-primary me-1" type="button" (click)="openDialog(user)">Modifier</button>
                  <!-- Supprimer son propre compte couperait l'acces admin en cours. -->
                  <button
                    class="btn btn-sm btn-outline-danger"
                    type="button"
                    [disabled]="user.username === auth.username()"
                    [title]="user.username === auth.username() ? 'Impossible de supprimer votre propre compte' : ''"
                    (click)="remove(user)"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class UserListPage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly dialog = inject(Dialog);
  private readonly notifier = inject(Notifier);
  protected readonly auth = inject(AuthService);

  protected readonly users = signal<User[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  protected fullName(user: User): string {
    return [user.firstname, user.lastname].filter(Boolean).join(' ');
  }

  openDialog(user: User | null = null): void {
    this.dialog
      .open<UserDialogResult, User | null>(UserDialog, { data: user, width: '520px', maxWidth: '95vw' })
      .closed
      .pipe(
        filter((result): result is UserDialogResult => !!result),
        switchMap((result): Observable<User> =>
          result.kind === 'create'
            ? this.userService.create(result.request)
            : this.userService.update(user!.id, result.request),
        ),
      )
      .subscribe({
        next: (saved) => {
          let message = user ? `${saved.username} modifié` : `${saved.username} créé`;
          if (user && saved.username === this.auth.username()) {
            // Les roles portes par le jeton en cours ne changent qu'a la prochaine connexion.
            message += '. Vos rôles seront mis à jour a votre prochaine connexion.';
          }
          this.notifier.success(message);
          this.load();
        },
        error: (error) => this.notifier.error(error),
      });
  }

  remove(user: User): void {
    confirm(this.dialog, {
      title: "Supprimer l'utilisateur",
      message: `Supprimer définitivement le compte "${user.username}" ?`,
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.userService.delete(user.id)),
      )
      .subscribe({
        next: () => {
          this.notifier.success('Utilisateur supprimé');
          this.load();
        },
        error: (error) => this.notifier.error(error),
      });
  }

  private load(): void {
    this.loading.set(true);
    this.userService.findAll().subscribe({
      next: (users) => {
        this.users.set([...users].sort((a, b) => a.username.localeCompare(b.username)));
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.notifier.error(error);
      },
    });
  }
}
