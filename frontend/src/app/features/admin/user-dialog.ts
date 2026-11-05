import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ROLES, Role, User, UserCreateRequest, UserUpdateRequest } from '../../core/models';
import { emptyToNull } from '../../shared/forms';
import { RoleLabelPipe } from '../../shared/role-label.pipe';

export type UserDialogResult =
  | { kind: 'create'; request: UserCreateRequest }
  | { kind: 'update'; request: UserUpdateRequest };

/**
 * Creation (data = null) ou modification d'un utilisateur par un admin.
 * A la creation, le backend attribue toujours ROLE_USER : les roles ne sont
 * donc modifiables qu'une fois le compte cree.
 */
@Component({
  selector: 'app-user-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    RoleLabelPipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ user ? 'Modifier ' + user.username : 'Nouvel utilisateur' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="form-fields">
        @if (!user) {
          <mat-form-field>
            <mat-label>Nom d'utilisateur</mat-label>
            <input matInput formControlName="username" required cdkFocusInitial />
            <mat-hint>3 à 50 caractères</mat-hint>
          </mat-form-field>
        }
        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" [required]="!user" />
          @if (form.controls.email.hasError('email')) {
            <mat-error>Adresse email invalide</mat-error>
          }
        </mat-form-field>
        <div class="form-row">
          <mat-form-field>
            <mat-label>Prénom</mat-label>
            <input matInput formControlName="firstname" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Nom</mat-label>
            <input matInput formControlName="lastname" />
          </mat-form-field>
        </div>
        <mat-form-field>
          <mat-label>{{ user ? 'Nouveau mot de passe' : 'Mot de passe' }}</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="new-password" [required]="!user" />
          <mat-hint>{{ user ? 'Laisser vide pour le conserver' : '8 caractères minimum' }}</mat-hint>
        </mat-form-field>

        @if (user) {
          <fieldset class="roles" formGroupName="roles">
            <legend>Rôles</legend>
            @for (role of roles; track role) {
              <mat-checkbox [formControlName]="role">{{ role | roleLabel }}</mat-checkbox>
            }
            @if (form.controls.roles.hasError('noRole')) {
              <p class="form-error">Au moins un rôle est requis.</p>
            }
          </fieldset>
        } @else {
          <p class="muted">Le compte est créé avec le rôle Utilisateur ; les rôles se modifient ensuite.</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button type="submit">Enregistrer</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .roles {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      border: none;
      padding: 0;
      margin: 8px 0 0;
    }
    legend {
      font: var(--mat-sys-title-small);
      margin-bottom: 4px;
    }
  `,
})
export class UserDialog {
  protected readonly user = inject<User | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<UserDialog, UserDialogResult>>(MatDialogRef);
  protected readonly roles = ROLES;

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    username: [
      '',
      this.user ? [] : [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
    ],
    email: [this.user?.email ?? '', this.user ? [Validators.email] : [Validators.required, Validators.email]],
    firstname: [this.user?.firstname ?? ''],
    lastname: [this.user?.lastname ?? ''],
    password: ['', this.user ? [Validators.minLength(8)] : [Validators.required, Validators.minLength(8)]],
    roles: this.fb.group(
      Object.fromEntries(ROLES.map((role) => [role, this.user?.roles.includes(role) ?? false])) as Record<
        Role,
        boolean
      >,
      {
        // Seulement en modification : a la creation, les roles ne sont pas saisis.
        validators: (group) =>
          !this.user || Object.values(group.value as Record<Role, boolean>).some(Boolean)
            ? null
            : { noRole: true },
      },
    ),
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (!this.user) {
      this.dialogRef.close({
        kind: 'create',
        request: {
          username: value.username.trim(),
          password: value.password,
          email: value.email.trim(),
          firstname: emptyToNull(value.firstname),
          lastname: emptyToNull(value.lastname),
        },
      });
      return;
    }
    this.dialogRef.close({
      kind: 'update',
      request: {
        firstname: emptyToNull(value.firstname),
        lastname: emptyToNull(value.lastname),
        email: emptyToNull(value.email),
        password: emptyToNull(value.password),
        roles: ROLES.filter((role) => value.roles[role]),
      },
    });
  }
}
