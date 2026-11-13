import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/notifier';
import { emptyToNull, showError } from '../../shared/forms';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-sm-10 col-md-8 col-lg-6">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <h1 class="card-title h4 mb-4">Créer un compte</h1>
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <div class="mb-3">
                <label class="form-label" for="register-username">Nom d'utilisateur</label>
                <input
                  id="register-username"
                  class="form-control"
                  formControlName="username"
                  autocomplete="username"
                  required
                  [class.is-invalid]="showError(form.controls.username)"
                />
                <div class="invalid-feedback">Entre 3 et 50 caractères.</div>
                <div class="form-text">3 à 50 caractères.</div>
              </div>
              <div class="mb-3">
                <label class="form-label" for="register-email">Email</label>
                <input
                  id="register-email"
                  class="form-control"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  required
                  [class.is-invalid]="showError(form.controls.email)"
                />
                <div class="invalid-feedback">Adresse email invalide.</div>
              </div>
              <div class="mb-3">
                <label class="form-label" for="register-password">Mot de passe</label>
                <input
                  id="register-password"
                  class="form-control"
                  type="password"
                  formControlName="password"
                  autocomplete="new-password"
                  required
                  [class.is-invalid]="showError(form.controls.password)"
                />
                <div class="invalid-feedback">8 caractères minimum.</div>
                <div class="form-text">8 caractères minimum.</div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-sm-6">
                  <label class="form-label" for="register-firstname">Prénom</label>
                  <input id="register-firstname" class="form-control" formControlName="firstname" autocomplete="given-name" />
                </div>
                <div class="col-sm-6">
                  <label class="form-label" for="register-lastname">Nom</label>
                  <input id="register-lastname" class="form-control" formControlName="lastname" autocomplete="family-name" />
                </div>
              </div>
              @if (error(); as message) {
                <div class="alert alert-danger" role="alert">{{ message }}</div>
              }
              <div class="d-flex justify-content-between align-items-center">
                <a routerLink="/login">J'ai déjà un compte</a>
                <button class="btn btn-primary" type="submit" [disabled]="loading()">
                  @if (loading()) {
                    <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                  }
                  Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstname: [''],
    lastname: [''],
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showError = showError;

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    // Inscription puis connexion automatique avec les memes identifiants.
    this.auth
      .register({ ...value, firstname: emptyToNull(value.firstname), lastname: emptyToNull(value.lastname) })
      .pipe(switchMap(() => this.auth.login({ username: value.username, password: value.password })))
      .subscribe({
        next: () => this.router.navigate(['/tasks']),
        error: (error) => {
          this.loading.set(false);
          this.error.set(errorMessage(error));
        },
      });
  }
}
