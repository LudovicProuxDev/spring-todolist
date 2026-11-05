import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { dialogMock, notifierMock } from '../../../testing/mocks';
import { CategoryService, TaskService } from '../../core/api/api.services';
import { Category, Task } from '../../core/models';
import { TaskDialog } from './task-dialog';
import { TaskListPage } from './task-list-page';

describe('TaskListPage', () => {
  const categories: Category[] = [
    { id: 2, label: 'Travail', color: '#3366FF' },
    { id: 1, label: 'Maison', color: null },
  ];
  const tasks: Task[] = [
    { id: 1, description: 'Ancienne', createdAt: '2026-11-01T10:00:00', category: null },
    { id: 2, description: 'Recente', createdAt: '2026-11-05T10:00:00', category: categories[0] },
  ];

  let taskService: Record<'findAll' | 'create' | 'update' | 'delete', ReturnType<typeof vi.fn>>;

  async function render(...dialogResults: unknown[]) {
    taskService = {
      findAll: vi.fn(() => of(tasks)),
      create: vi.fn(() => of(tasks[0])),
      update: vi.fn(() => of(tasks[0])),
      delete: vi.fn(() => of(undefined)),
    };
    const dialog = dialogMock(...dialogResults);
    const { notifier, provider } = notifierMock();
    TestBed.configureTestingModule({
      imports: [TaskListPage],
      providers: [
        { provide: TaskService, useValue: taskService },
        { provide: CategoryService, useValue: { findAll: () => of(categories) } },
        dialog.provider,
        provider,
      ],
    });
    const fixture = TestBed.createComponent(TaskListPage);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement, component: fixture.componentInstance, dialog, notifier };
  }

  function descriptions(element: HTMLElement): string[] {
    return Array.from(element.querySelectorAll('td.description')).map((cell) => cell.firstChild!.textContent!.trim());
  }

  it('should list tasks newest first', async () => {
    const { element } = await render();

    expect(taskService.findAll).toHaveBeenCalledWith(null);
    expect(descriptions(element)).toEqual(['Recente', 'Ancienne']);
  });

  it('should show an empty state', async () => {
    TestBed.overrideProvider(TaskService, { useValue: { findAll: () => of([]) } });
    const { element } = await render();

    expect(element.querySelector('.empty')?.textContent).toContain('Aucune tâche');
  });

  it('should reload tasks when the category filter changes', async () => {
    const { component } = await render();

    component.changeFilter(2);

    expect(taskService.findAll).toHaveBeenLastCalledWith(2);
  });

  it('should pass categories and the active filter to the creation dialog', async () => {
    const { component, dialog } = await render({ description: 'Nouvelle', categoryId: 2 });
    component.changeFilter(2);

    component.openDialog();

    expect(dialog.open).toHaveBeenCalledWith(TaskDialog, expect.objectContaining({
      data: { task: null, categories: expect.any(Array), defaultCategoryId: 2 },
    }));
    expect(taskService.create).toHaveBeenCalledWith({ description: 'Nouvelle', categoryId: 2 });
  });

  it('should update an existing task', async () => {
    const { component, notifier } = await render({ description: 'Modifiee', categoryId: null });

    component.openDialog(tasks[1]);

    expect(taskService.update).toHaveBeenCalledWith(2, { description: 'Modifiee', categoryId: null });
    expect(notifier.success).toHaveBeenCalledWith('Tâche modifiée');
  });

  it('should do nothing when the dialog is cancelled', async () => {
    const { component } = await render(undefined);

    component.openDialog();

    expect(taskService.create).not.toHaveBeenCalled();
  });

  it('should delete a task after confirmation', async () => {
    const { component } = await render(true);

    component.remove(tasks[0]);

    expect(taskService.delete).toHaveBeenCalledWith(1);
  });

  it('should not delete when the confirmation is refused', async () => {
    const { component } = await render(false);

    component.remove(tasks[0]);

    expect(taskService.delete).not.toHaveBeenCalled();
  });

  it('should report API errors', async () => {
    const { component, notifier } = await render({ description: 'X', categoryId: 99 });
    const error = new HttpErrorResponse({ status: 404, error: { message: 'Catégorie introuvable' } });
    taskService.create.mockReturnValue(throwError(() => error));

    component.openDialog();

    expect(notifier.error).toHaveBeenCalledWith(error);
  });

  it('should report an error when tasks cannot be loaded', async () => {
    const error = new HttpErrorResponse({ status: 0 });
    TestBed.overrideProvider(TaskService, { useValue: { findAll: () => throwError(() => error) } });
    const { element, notifier } = await render();

    expect(notifier.error).toHaveBeenCalledWith(error);
    expect(element.querySelector('mat-progress-bar')).toBeNull();
  });
});
