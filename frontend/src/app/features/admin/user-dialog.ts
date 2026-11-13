import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ROLES, Role, User, UserCreateRequest, UserUpdateRequest } from '../../core/models';
import { emptyToNull, showError } from '../../shared/forms';
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
  imports: [ReactiveFormsModule, RoleLabelPipe],
  template: `
    <form class="modal-content" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <div class="modal-header">
        <h2 class="modal-title fs-5">{{ user ? 'Modifier ' + user.username : 'Nouvel utilisateur' }}</h2>
      </div>
      <div class="modal-body">
        @if (!user) {
          <div class="mb-3">
            <label class="form-label" for="user-username">Nom d'utilisateur</label>
            <input
              id="user-username"
              class="form-control"
              formControlName="username"
              required
              cdkFocusInitial
              [class.is-invalid]="showError(form.controls.username)"
            />
            <div class="invalid-feedback">Entre 3 et 50 caractères.</div>
          </div>
        }
        <div class="mb-3">
          <label class="form-label" for="user-email">Email</label>
          <input
            id="user-email"
            class="form-control"
            type="email"
            formControlName="email"
            [required]="!user"
            [class.is-invalid]="showError(form.controls.email)"
          />
          <div class="invalid-feedback">Adresse email invalide.</div>
        </div>
        <div class="row g-3 mb-3">
          <div class="col-sm-6">
            <label class="form-label" for="user-firstname">Prénom</label>
            <input id="user-firstname" class="form-control" formControlName="firstname" />
          </div>
          <div class="col-sm-6">
            <label class="form-label" for="user-lastname">Nom</label>
            <input id="user-lastname" class="form-control" formControlName="lastname" />
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label" for="user-password">{{ user ? 'Nouveau mot de passe' : 'Mot de passe' }}</label>
          <input
            id="user-password"
            class="form-control"
            type="password"
            formControlName="password"
            autocomplete="new-password"
            [required]="!user"
            [class.is-invalid]="showError(form.controls.password)"
          />
          <div class="invalid-feedback">8 caractères minimum.</div>
          <div class="form-text">{{ user ? 'Laisser vide pour le conserver.' : '8 caractères minimum.' }}</div>
        </div>

        @if (user) {
          <fieldset formGroupName="roles">
            <legend class="form-label fs-6">Rôles</legend>
            @for (role of roles; track role) {
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="checkbox" [id]="'user-role-' + role" [formControlName]="role" />
                <label class="form-check-label" [for]="'user-role-' + role">{{ role | roleLabel }}</label>
              </div>
            }
            @if (form.controls.roles.hasError('noRole')) {
              <div class="text-danger small mt-1">Au moins un rôle est requis.</div>
            }
          </fieldset>
        } @else {
          <p class="text-body-secondary small mb-0">
            Le compte est créé avec le rôle Utilisateur ; les rôles se modifient ensuite.
          </p>
        }
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="dialogRef.close()">Annuler</button>
        <button type="submit" class="btn btn-primary">Enregistrer</button>
      </div>
    </form>
  `,
})
export class UserDialog {
  protected readonly user = inject<User | null>(DIALOG_DATA);
  protected readonly dialogRef = inject<DialogRef<UserDialogResult>>(DialogRef);
  protected readonly showError = showError;
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
