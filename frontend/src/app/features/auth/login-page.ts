import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/notifier';
import { showError } from '../../shared/forms';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-sm-10 col-md-7 col-lg-5">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <h1 class="card-title h4 mb-4">Connexion</h1>
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <div class="mb-3">
                <label class="form-label" for="login-username">Nom d'utilisateur</label>
                <input
                  id="login-username"
                  class="form-control"
                  formControlName="username"
                  autocomplete="username"
                  required
                  [class.is-invalid]="showError(form.controls.username)"
                />
                <div class="invalid-feedback">Le nom d'utilisateur est obligatoire.</div>
              </div>
              <div class="mb-3">
                <label class="form-label" for="login-password">Mot de passe</label>
                <input
                  id="login-password"
                  class="form-control"
                  type="password"
                  formControlName="password"
                  autocomplete="current-password"
                  required
                  [class.is-invalid]="showError(form.controls.password)"
                />
                <div class="invalid-feedback">Le mot de passe est obligatoire.</div>
              </div>
              @if (error(); as message) {
                <div class="alert alert-danger" role="alert">{{ message }}</div>
              }
              <div class="d-flex justify-content-between align-items-center">
                <a routerLink="/register">Créer un compte</a>
                <button class="btn btn-primary" type="submit" [disabled]="loading()">
                  @if (loading()) {
                    <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                  }
                  Se connecter
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showError = showError;

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/tasks']),
      error: (error) => {
        this.loading.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }
}
