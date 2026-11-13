import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { UserService } from '../../core/api/api.services';
import { User, UserUpdateRequest } from '../../core/models';
import { Notifier } from '../../core/notifier';
import { emptyToNull, showError } from '../../shared/forms';
import { RoleLabelPipe } from '../../shared/role-label.pipe';
import { Spinner } from '../../shared/spinner';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, RoleLabelPipe, Spinner],
  template: `
    <div class="pb-2 mb-4 border-bottom">
      <h1 class="h3 mb-0">Mon profil</h1>
    </div>

    @if (loading()) {
      <app-spinner />
    }

    @if (user(); as user) {
      <div class="row">
        <div class="col-lg-8 col-xl-6">
          <div class="card shadow-sm">
            <div class="card-body p-4">
              <h2 class="card-title h5">{{ user.username }}</h2>
              <div class="mb-4">
                @for (role of user.roles; track role) {
                  <span
                    class="badge me-1"
                    [class.text-bg-primary]="role === 'ROLE_ADMIN'"
                    [class.text-bg-secondary]="role !== 'ROLE_ADMIN'"
                  >
                    {{ role | roleLabel }}
                  </span>
                }
              </div>
              <form [formGroup]="form" (ngSubmit)="save(user)" novalidate>
                <div class="row g-3 mb-3">
                  <div class="col-sm-6">
                    <label class="form-label" for="profile-firstname">Prénom</label>
                    <input id="profile-firstname" class="form-control" formControlName="firstname" autocomplete="given-name" />
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label" for="profile-lastname">Nom</label>
                    <input id="profile-lastname" class="form-control" formControlName="lastname" autocomplete="family-name" />
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="profile-email">Email</label>
                  <input
                    id="profile-email"
                    class="form-control"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    [class.is-invalid]="showError(form.controls.email)"
                  />
                  <div class="invalid-feedback">Adresse email invalide.</div>
                </div>
                <div class="mb-4">
                  <label class="form-label" for="profile-password">Nouveau mot de passe</label>
                  <input
                    id="profile-password"
                    class="form-control"
                    type="password"
                    formControlName="password"
                    autocomplete="new-password"
                    [class.is-invalid]="showError(form.controls.password)"
                  />
                  <div class="invalid-feedback">8 caractères minimum.</div>
                  <div class="form-text">Laisser vide pour le conserver (8 caractères minimum sinon).</div>
                </div>
                <div class="text-end">
                  <button class="btn btn-primary" type="submit" [disabled]="saving() || form.pristine">Enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ProfilePage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly notifier = inject(Notifier);

  protected readonly user = signal<User | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly showError = showError;

  protected readonly form = inject(NonNullableFormBuilder).group({
    firstname: [''],
    lastname: [''],
    email: ['', Validators.email],
    password: ['', Validators.minLength(8)],
  });

  ngOnInit(): void {
    this.userService.me().subscribe({
      next: (user) => this.show(user),
      error: (error) => {
        this.loading.set(false);
        this.notifier.error(error);
      },
    });
  }

  save(user: User): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    // Pas de champ "roles" : le backend le refuserait (403) pour un non-admin.
    const request: UserUpdateRequest = {
      firstname: emptyToNull(value.firstname),
      lastname: emptyToNull(value.lastname),
      email: emptyToNull(value.email),
      password: emptyToNull(value.password),
    };
    this.saving.set(true);
    this.userService.update(user.id, request).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.show(updated);
        this.notifier.success('Profil mis à jour');
      },
      error: (error) => {
        this.saving.set(false);
        this.notifier.error(error);
      },
    });
  }

  private show(user: User): void {
    this.user.set(user);
    this.loading.set(false);
    this.form.reset({
      firstname: user.firstname ?? '',
      lastname: user.lastname ?? '',
      email: user.email ?? '',
      password: '',
    });
  }
}
