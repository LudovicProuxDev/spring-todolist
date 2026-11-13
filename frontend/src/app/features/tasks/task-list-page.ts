import { Dialog } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { filter, switchMap } from 'rxjs';

import { CategoryService, TaskService } from '../../core/api/api.services';
import { Category, Task, TaskRequest } from '../../core/models';
import { Notifier } from '../../core/notifier';
import { confirm } from '../../shared/confirm-dialog';
import { Spinner } from '../../shared/spinner';
import { TaskDialog, TaskDialogData } from './task-dialog';

@Component({
  selector: 'app-task-list-page',
  imports: [DatePipe, Spinner],
  template: `
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-2 mb-4 border-bottom">
      <h1 class="h3 mb-0">Tâches</h1>
      <button class="btn btn-primary" type="button" (click)="openDialog()">Nouvelle tâche</button>
    </div>

    <div class="row mb-3">
      <div class="col-sm-6 col-lg-4">
        <label class="form-label" for="task-filter">Filtrer par catégorie</label>
        <select id="task-filter" class="form-select" (change)="onFilterChange($any($event.target).value)">
          <option value="" [selected]="categoryFilter() === null">Toutes les catégories</option>
          @for (category of categories(); track category.id) {
            <option [value]="category.id" [selected]="category.id === categoryFilter()">{{ category.label }}</option>
          }
        </select>
      </div>
    </div>

    @if (loading()) {
      <app-spinner />
    } @else if (tasks().length === 0) {
      <div class="alert alert-secondary">
        Aucune tâche{{ categoryFilter() !== null ? ' dans cette catégorie' : '' }}.
      </div>
    } @else {
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th scope="col">Description</th>
              <th scope="col">Catégorie</th>
              <th scope="col">Créée le</th>
              <th scope="col"><span class="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            @for (task of tasks(); track task.id) {
              <tr>
                <!-- Sur une seule ligne : pre-wrap afficherait les espaces du template. -->
                <td class="description">{{ task.description }}</td>
                <td>
                  @if (task.category; as category) {
                    <span class="badge rounded-pill text-bg-light border d-inline-flex align-items-center gap-1">
                      <span class="swatch" [style.background]="category.color ?? 'transparent'"></span>
                      {{ category.label }}
                    </span>
                  } @else {
                    <span class="text-body-secondary">Aucune</span>
                  }
                </td>
                <td class="text-nowrap">{{ task.createdAt | date: 'short' }}</td>
                <td class="text-end text-nowrap">
                  <button class="btn btn-sm btn-outline-primary me-1" type="button" (click)="openDialog(task)">Modifier</button>
                  <button class="btn btn-sm btn-outline-danger" type="button" (click)="remove(task)">Supprimer</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class TaskListPage implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(Dialog);
  private readonly notifier = inject(Notifier);

  protected readonly tasks = signal<Task[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly categoryFilter = signal<number | null>(null);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.categoryService.findAll().subscribe({
      next: (categories) =>
        this.categories.set([...categories].sort((a, b) => a.label.localeCompare(b.label))),
      error: (error) => this.notifier.error(error),
    });
    this.loadTasks();
  }

  /** Valeur brute du select : "" = toutes les categories. */
  protected onFilterChange(value: string): void {
    this.changeFilter(value === '' ? null : Number(value));
  }

  changeFilter(categoryId: number | null): void {
    this.categoryFilter.set(categoryId);
    this.loadTasks();
  }

  openDialog(task: Task | null = null): void {
    const data: TaskDialogData = { task, categories: this.categories(), defaultCategoryId: this.categoryFilter() };
    this.dialog
      .open<TaskRequest, TaskDialogData>(TaskDialog, { data, width: '520px', maxWidth: '95vw' })
      .closed
      .pipe(
        filter((request): request is TaskRequest => !!request),
        switchMap((request) => (task ? this.taskService.update(task.id, request) : this.taskService.create(request))),
      )
      .subscribe({
        next: () => {
          this.notifier.success(task ? 'Tâche modifiée' : 'Tâche créée');
          this.loadTasks();
        },
        error: (error) => this.notifier.error(error),
      });
  }

  remove(task: Task): void {
    confirm(this.dialog, { title: 'Supprimer la tâche', message: `Supprimer "${task.description}" ?` })
      .pipe(
        filter(Boolean),
        switchMap(() => this.taskService.delete(task.id)),
      )
      .subscribe({
        next: () => {
          this.notifier.success('Tâche supprimée');
          this.loadTasks();
        },
        error: (error) => this.notifier.error(error),
      });
  }

  private loadTasks(): void {
    this.loading.set(true);
    this.taskService.findAll(this.categoryFilter()).subscribe({
      next: (tasks) => {
        // Plus recentes en premier.
        this.tasks.set([...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.notifier.error(error);
      },
    });
  }
}
