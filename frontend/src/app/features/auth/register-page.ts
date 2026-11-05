import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/notifier';
import { emptyToNull } from '../../shared/forms';

@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
  ],
  template: `
    <mat-card class="auth-card">
      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }
      <mat-card-header>
        <mat-card-title>Créer un compte</mat-card-title>
      </mat-card-header>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-card-content class="form-fields">
          <mat-form-field>
            <mat-label>Nom d'utilisateur</mat-label>
            <input matInput formControlName="username" autocomplete="username" required />
            <mat-hint>3 à 50 caractères</mat-hint>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" required />
            @if (form.controls.email.hasError('email')) {
              <mat-error>Adresse email invalide</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Mot de passe</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="new-password" required />
            <mat-hint>8 caractères minimum</mat-hint>
          </mat-form-field>
          <div class="form-row">
            <mat-form-field>
              <mat-label>Prénom</mat-label>
              <input matInput formControlName="firstname" autocomplete="given-name" />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Nom</mat-label>
              <input matInput formControlName="lastname" autocomplete="family-name" />
            </mat-form-field>
          </div>
          @if (error(); as message) {
            <p class="form-error" role="alert">{{ message }}</p>
          }
        </mat-card-content>
        <mat-card-actions class="auth-actions">
          <a mat-button routerLink="/login">J'ai déjà un compte</a>
          <button mat-flat-button type="submit" [disabled]="loading()">Créer le compte</button>
        </mat-card-actions>
      </form>
    </mat-card>
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
