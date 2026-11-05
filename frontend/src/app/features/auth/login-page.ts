import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/notifier';

@Component({
  selector: 'app-login-page',
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
        <mat-card-title>Connexion</mat-card-title>
      </mat-card-header>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-card-content class="form-fields">
          <mat-form-field>
            <mat-label>Nom d'utilisateur</mat-label>
            <input matInput formControlName="username" autocomplete="username" required />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Mot de passe</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="current-password" required />
          </mat-form-field>
          @if (error(); as message) {
            <p class="form-error" role="alert">{{ message }}</p>
          }
        </mat-card-content>
        <mat-card-actions class="auth-actions">
          <a mat-button routerLink="/register">Créer un compte</a>
          <button mat-flat-button type="submit" [disabled]="loading()">Se connecter</button>
        </mat-card-actions>
      </form>
    </mat-card>
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
