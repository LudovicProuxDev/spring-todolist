import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Category, Task, TaskRequest } from '../../core/models';

export interface TaskDialogData {
  task: Task | null;
  categories: Category[];
  /** Categorie proposee par defaut a la creation (filtre actif de la liste). */
  defaultCategoryId: number | null;
}

@Component({
  selector: 'app-task-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.task ? 'Modifier la tâche' : 'Nouvelle tâche' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="form-fields">
        <mat-form-field>
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" maxlength="1000" required cdkFocusInitial></textarea>
          <mat-hint align="end">{{ form.controls.description.value.length }} / 1000</mat-hint>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Catégorie</mat-label>
          <mat-select formControlName="categoryId">
            <mat-option [value]="null">Aucune</mat-option>
            @for (category of data.categories; track category.id) {
              <mat-option [value]="category.id">{{ category.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button type="submit">Enregistrer</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class TaskDialog {
  protected readonly data = inject<TaskDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<TaskDialog, TaskRequest>>(MatDialogRef);

  protected readonly form = inject(NonNullableFormBuilder).group({
    description: [this.data.task?.description ?? '', [Validators.required, Validators.maxLength(1000)]],
    categoryId: [
      this.data.task ? (this.data.task.category?.id ?? null) : this.data.defaultCategoryId,
    ] as [number | null],
  });

  save(): void {
    if (this.form.invalid || this.form.controls.description.value.trim().length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    const { description, categoryId } = this.form.getRawValue();
    this.dialogRef.close({ description: description.trim(), categoryId });
  }
}
