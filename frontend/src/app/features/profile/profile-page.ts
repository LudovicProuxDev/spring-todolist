import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { UserService } from '../../core/api/api.services';
import { User, UserUpdateRequest } from '../../core/models';
import { Notifier } from '../../core/notifier';
import { emptyToNull } from '../../shared/forms';
import { RoleLabelPipe } from '../../shared/role-label.pipe';

@Component({
  selector: 'app-profile-page',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    RoleLabelPipe,
  ],
  template: `
    <header class="page-header">
      <h1>Mon profil</h1>
    </header>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (user(); as user) {
      <mat-card class="narrow-card">
        <mat-card-header>
          <mat-card-title>{{ user.username }}</mat-card-title>
          <mat-card-subtitle>
            <mat-chip-set>
              @for (role of user.roles; track role) {
                <mat-chip [disableRipple]="true">{{ role | roleLabel }}</mat-chip>
              }
            </mat-chip-set>
          </mat-card-subtitle>
        </mat-card-header>
        <form [formGroup]="form" (ngSubmit)="save(user)">
          <mat-card-content class="form-fields">
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
            <mat-form-field>
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              @if (form.controls.email.hasError('email')) {
                <mat-error>Adresse email invalide</mat-error>
              }
            </mat-form-field>
            <mat-form-field>
              <mat-label>Nouveau mot de passe</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="new-password" />
              <mat-hint>Laisser vide pour le conserver (8 caractères minimum sinon)</mat-hint>
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-flat-button type="submit" [disabled]="saving() || form.pristine">Enregistrer</button>
          </mat-card-actions>
        </form>
      </mat-card>
    }
  `,
})
export class ProfilePage implements OnInit {
  private readonly userService = inject(UserService);
  private readonly notifier = inject(Notifier);

  protected readonly user = signal<User | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);

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
