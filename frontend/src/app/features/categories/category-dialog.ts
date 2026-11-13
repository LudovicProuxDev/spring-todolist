import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Category, CategoryRequest } from '../../core/models';
import { emptyToNull, hexColorValidator, showError } from '../../shared/forms';

/** Creation (data = null) ou modification d'une categorie ; renvoie la CategoryRequest saisie. */
@Component({
  selector: 'app-category-dialog',
  imports: [ReactiveFormsModule],
  template: `
    <form class="modal-content" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <div class="modal-header">
        <h2 class="modal-title fs-5">{{ category ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}</h2>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label class="form-label" for="category-label">Nom</label>
          <input
            id="category-label"
            class="form-control"
            formControlName="label"
            required
            cdkFocusInitial
            [class.is-invalid]="showError(form.controls.label)"
          />
          <div class="invalid-feedback">Le nom est obligatoire.</div>
        </div>
        <div>
          <label class="form-label" for="category-color">Couleur (optionnelle)</label>
          <div class="input-group has-validation">
            <input
              id="category-color"
              class="form-control"
              formControlName="color"
              placeholder="#FF0000"
              [class.is-invalid]="showError(form.controls.color)"
            />
            <input
              type="color"
              class="form-control form-control-color"
              aria-label="Choisir une couleur"
              [value]="pickerValue()"
              (input)="form.controls.color.setValue($any($event.target).value)"
            />
            <div class="invalid-feedback">Code hexadécimal attendu, par exemple #FF0000.</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="dialogRef.close()">Annuler</button>
        <button type="submit" class="btn btn-primary">Enregistrer</button>
      </div>
    </form>
  `,
})
export class CategoryDialog {
  protected readonly category = inject<Category | null>(DIALOG_DATA);
  protected readonly dialogRef = inject<DialogRef<CategoryRequest>>(DialogRef);
  protected readonly showError = showError;

  protected readonly form = inject(NonNullableFormBuilder).group({
    label: [this.category?.label ?? '', Validators.required],
    color: [this.category?.color ?? '', hexColorValidator],
  });

  /** Le selecteur natif n'accepte que #RRGGBB. */
  protected pickerValue(): string {
    const color = this.form.controls.color.value;
    return /^#[A-Fa-f0-9]{6}$/.test(color) ? color : '#0d6efd';
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
