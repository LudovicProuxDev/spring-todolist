import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Category, CategoryRequest } from '../../core/models';
import { emptyToNull, hexColorValidator } from '../../shared/forms';

/** Creation (data = null) ou modification d'une categorie ; renvoie la CategoryRequest saisie. */
@Component({
  selector: 'app-category-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ category ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="form-fields">
        <mat-form-field>
          <mat-label>Nom</mat-label>
          <input matInput formControlName="label" required cdkFocusInitial />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Couleur (optionnelle)</mat-label>
          <input matInput formControlName="color" placeholder="#FF0000" />
          <input
            matSuffix
            type="color"
            class="color-picker"
            aria-label="Choisir une couleur"
            [value]="pickerValue()"
            (input)="form.controls.color.setValue($any($event.target).value)"
          />
          @if (form.controls.color.hasError('pattern')) {
            <mat-error>Code hexadécimal attendu, par exemple #FF0000</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button type="submit">Enregistrer</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class CategoryDialog {
  protected readonly category = inject<Category | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<CategoryDialog, CategoryRequest>>(MatDialogRef);

  protected readonly form = inject(NonNullableFormBuilder).group({
    label: [this.category?.label ?? '', Validators.required],
    color: [this.category?.color ?? '', hexColorValidator],
  });

  /** Le selecteur natif n'accepte que #RRGGBB. */
  protected pickerValue(): string {
    const color = this.form.controls.color.value;
    return /^#[A-Fa-f0-9]{6}$/.test(color) ? color : '#3f51b5';
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { label, color } = this.form.getRawValue();
    this.dialogRef.close({ label: label.trim(), color: emptyToNull(color) });
  }
}
