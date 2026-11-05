import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { TaskDialog, TaskDialogData } from './task-dialog';

describe('TaskDialog', () => {
  let close: ReturnType<typeof vi.fn>;

  function create(data: TaskDialogData) {
    close = vi.fn();
    TestBed.configureTestingModule({
      imports: [TaskDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close } },
      ],
    });
    const fixture = TestBed.createComponent(TaskDialog);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as { form: any; save(): void };
  }

  const categories = [{ id: 1, label: 'Maison', color: null }];

  it('should preselect the active filter category on creation', () => {
    const dialog = create({ task: null, categories, defaultCategoryId: 1 });

    expect(dialog.form.controls.categoryId.value).toBe(1);
  });

  it('should keep the category of an edited task', () => {
    const dialog = create({
      task: { id: 4, description: 'Courses', createdAt: '2026-11-05T10:00:00', category: null },
      categories,
      defaultCategoryId: 1,
    });

    expect(dialog.form.controls.categoryId.value).toBeNull();
  });

  it('should return a trimmed request', () => {
    const dialog = create({ task: null, categories, defaultCategoryId: null });
    dialog.form.patchValue({ description: '  Faire les courses  ', categoryId: 1 });

    dialog.save();

    expect(close).toHaveBeenCalledWith({ description: 'Faire les courses', categoryId: 1 });
  });

  it('should refuse a blank description', () => {
    const dialog = create({ task: null, categories, defaultCategoryId: null });
    dialog.form.patchValue({ description: '   ' });

    dialog.save();

    expect(close).not.toHaveBeenCalled();
  });
});
