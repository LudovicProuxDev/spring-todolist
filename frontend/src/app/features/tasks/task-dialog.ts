import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Category, Task, TaskRequest } from '../../core/models';
import { showError } from '../../shared/forms';

export interface TaskDialogData {
  task: Task | null;
  categories: Category[];
  /** Categorie proposee par defaut a la creation (filtre actif de la liste). */
  defaultCategoryId: number | null;
}

@Component({
  selector: 'app-task-dialog',
  imports: [ReactiveFormsModule],
  template: `
    <form class="modal-content" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <div class="modal-header">
        <h2 class="modal-title fs-5">{{ data.task ? 'Modifier la tâche' : 'Nouvelle tâche' }}</h2>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label class="form-label" for="task-description">Description</label>
          <textarea
            id="task-description"
            class="form-control"
            formControlName="description"
            rows="3"
            maxlength="1000"
            required
            cdkFocusInitial
            [class.is-invalid]="showError(form.controls.description)"
          ></textarea>
          <div class="invalid-feedback">La description est obligatoire.</div>
          <div class="form-text text-end">{{ form.controls.description.value.length }} / 1000</div>
        </div>
        <div>
          <label class="form-label" for="task-category">Catégorie</label>
          <select id="task-category" class="form-select" formControlName="categoryId">
            <option [ngValue]="null">Aucune</option>
            @for (category of data.categories; track category.id) {
              <option [ngValue]="category.id">{{ category.label }}</option>
            }
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="dialogRef.close()">Annuler</button>
        <button type="submit" class="btn btn-primary">Enregistrer</button>
      </div>
    </form>
  `,
})
export class TaskDialog {
  protected readonly data = inject<TaskDialogData>(DIALOG_DATA);
  protected readonly dialogRef = inject<DialogRef<TaskRequest>>(DialogRef);
  protected readonly showError = showError;

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
