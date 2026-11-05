import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, filter, switchMap } from 'rxjs';

import { UserService } from '../../core/api/api.services';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models';
import { Notifier } from '../../core/notifier';
import { confirm } from '../../shared/confirm-dialog';
import { RoleLabelPipe } from '../../shared/role-label.pipe';
import { UserDialog, UserDialogResult } from './user-dialog';

@Component({
  selector: 'app-user-list-page',
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatTooltipModule,
    RoleLabelPipe,
  ],
  template: `
    <header class="page-header">
      <h1>Utilisateurs</h1>
      <button mat-flat-button (click)="openDialog()">
        <mat-icon>person_add</mat-icon>
        Nouvel utilisateur
      </button>
    </header>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <div class="table-wrapper">
      <table mat-table [dataSource]="users()">
        <ng-container matColumnDef="username">
          <th mat-header-cell *matHeaderCellDef>Utilisateur</th>
          <td mat-cell *matCellDef="let user">
            <strong>{{ user.username }}</strong>
            @if (user.username === auth.username()) {
              <span class="muted"> (vous)</span>
            }
            <!-- Sur petit ecran, les colonnes Email et Roles sont masquees : rappel ici. -->
            <span class="small-screen-only muted">{{ user.email }}</span>
            <span class="small-screen-only muted">
              @for (role of user.roles; track role) {
                {{ role | roleLabel }}{{ $last ? '' : ', ' }}
              }
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nom</th>
          <td mat-cell *matCellDef="let user">{{ fullName(user) }}</td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let user">{{ user.email }}</td>
        </ng-container>

        <ng-container matColumnDef="roles">
          <th mat-header-cell *matHeaderCellDef>Rôles</th>
          <td mat-cell *matCellDef="let user">
            <mat-chip-set>
              @for (role of user.roles; track role) {
                <mat-chip [disableRipple]="true" [highlighted]="role === 'ROLE_ADMIN'">{{ role | roleLabel }}</mat-chip>
              }
            </mat-chip-set>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef><span class="visually-hidden">Actions</span></th>
          <td mat-cell *matCellDef="let user" class="row-actions">
            <button mat-icon-button matTooltip="Modifier" aria-label="Modifier" (click)="openDialog(user)">
              <mat-icon>edit</mat-icon>
            </button>
            <!-- Supprimer son propre compte couperait l'acces admin en cours. -->
            <button
              mat-icon-button
              [matTooltip]="user.username === auth.username() ? 'Impossible de supprimer votre propre compte' : 'Supprimer'"
              aria-label="Supprimer"
              [disabled]="user.username === auth.username()"
              (click)="remove(user)"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </div>
  `,
})
export class UserListPage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);
  protected readonly auth = inject(AuthService);

  protected readonly columns = ['username', 'name', 'email', 'roles', 'actions'];
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
      .open<UserDialog, User | null, UserDialogResult>(UserDialog, { data: user, width: '520px' })
      .afterClosed()
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
