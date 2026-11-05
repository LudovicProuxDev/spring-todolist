import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, switchMap } from 'rxjs';

import { CategoryService, TaskService } from '../../core/api/api.services';
import { Category, Task, TaskRequest } from '../../core/models';
import { Notifier } from '../../core/notifier';
import { confirm } from '../../shared/confirm-dialog';
import { TaskDialog, TaskDialogData } from './task-dialog';

@Component({
  selector: 'app-task-list-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <header class="page-header">
      <h1>Tâches</h1>
      <button mat-flat-button (click)="openDialog()">
        <mat-icon>add</mat-icon>
        Nouvelle tâche
      </button>
    </header>

    <mat-form-field class="filter" subscriptSizing="dynamic">
      <mat-label>Filtrer par catégorie</mat-label>
      <mat-select [value]="categoryFilter()" (valueChange)="changeFilter($event)">
        <mat-option [value]="null">Toutes les catégories</mat-option>
        @for (category of categories(); track category.id) {
          <mat-option [value]="category.id">{{ category.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (!loading() && tasks().length === 0) {
      <p class="empty">Aucune tâche{{ categoryFilter() !== null ? ' dans cette catégorie' : '' }}.</p>
    } @else {
      <div class="table-wrapper">
        <table mat-table [dataSource]="tasks()">
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Description</th>
            <td mat-cell *matCellDef="let task" class="description">
              {{ task.description }}
              <!-- Sur petit ecran, la colonne Categorie est masquee : rappel ici. -->
              @if (task.category; as category) {
                <span class="small-screen-only muted">
                  <span class="swatch" [style.background]="category.color ?? 'transparent'"></span>
                  {{ category.label }}
                </span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Catégorie</th>
            <td mat-cell *matCellDef="let task">
              @if (task.category; as category) {
                <mat-chip-set>
                  <mat-chip [disableRipple]="true">
                    <span matChipAvatar class="swatch" [style.background]="category.color ?? 'transparent'"></span>
                    {{ category.label }}
                  </mat-chip>
                </mat-chip-set>
              } @else {
                <span class="muted">Aucune</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Créée le</th>
            <td mat-cell *matCellDef="let task" class="nowrap">{{ task.createdAt | date: 'short' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef><span class="visually-hidden">Actions</span></th>
            <td mat-cell *matCellDef="let task" class="row-actions">
              <button mat-icon-button matTooltip="Modifier" aria-label="Modifier" (click)="openDialog(task)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button matTooltip="Supprimer" aria-label="Supprimer" (click)="remove(task)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      </div>
    }
  `,
})
export class TaskListPage implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);

  protected readonly columns = ['description', 'category', 'createdAt', 'actions'];
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

  changeFilter(categoryId: number | null): void {
    this.categoryFilter.set(categoryId);
    this.loadTasks();
  }

  openDialog(task: Task | null = null): void {
    const data: TaskDialogData = { task, categories: this.categories(), defaultCategoryId: this.categoryFilter() };
    this.dialog
      .open<TaskDialog, TaskDialogData, TaskRequest>(TaskDialog, { data, width: '520px' })
      .afterClosed()
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
