import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, switchMap } from 'rxjs';

import { CategoryService } from '../../core/api/api.services';
import { Category, CategoryRequest } from '../../core/models';
import { Notifier } from '../../core/notifier';
import { confirm } from '../../shared/confirm-dialog';
import { CategoryDialog } from './category-dialog';

@Component({
  selector: 'app-category-list-page',
  imports: [MatButtonModule, MatIconModule, MatListModule, MatProgressBarModule, MatTooltipModule],
  template: `
    <header class="page-header">
      <h1>Catégories</h1>
      <button mat-flat-button (click)="openDialog()">
        <mat-icon>add</mat-icon>
        Nouvelle catégorie
      </button>
    </header>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (!loading() && categories().length === 0) {
      <p class="empty">Aucune catégorie pour l'instant.</p>
    } @else {
      <mat-list class="surface-list">
        @for (category of categories(); track category.id) {
          <mat-list-item>
            <span matListItemIcon class="swatch" [style.background]="category.color ?? 'transparent'"></span>
            <span matListItemTitle>{{ category.label }}</span>
            <span matListItemLine>{{ category.color ?? 'Sans couleur' }}</span>
            <span matListItemMeta class="row-actions">
              <button mat-icon-button matTooltip="Modifier" aria-label="Modifier" (click)="openDialog(category)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button matTooltip="Supprimer" aria-label="Supprimer" (click)="remove(category)">
                <mat-icon>delete</mat-icon>
              </button>
            </span>
          </mat-list-item>
        }
      </mat-list>
    }
  `,
})
export class CategoryListPage implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);

  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  openDialog(category: Category | null = null): void {
    this.dialog
      .open<CategoryDialog, Category | null, CategoryRequest>(CategoryDialog, { data: category, width: '440px' })
      .afterClosed()
      .pipe(
        filter((request): request is CategoryRequest => !!request),
        switchMap((request) =>
          category ? this.categoryService.update(category.id, request) : this.categoryService.create(request),
        ),
      )
      .subscribe({
        next: () => {
          this.notifier.success(category ? 'Catégorie modifiée' : 'Catégorie créée');
          this.load();
        },
        error: (error) => this.notifier.error(error),
      });
  }

  remove(category: Category): void {
    confirm(this.dialog, {
      title: 'Supprimer la catégorie',
      message: `Supprimer "${category.label}" ? Une catégorie encore utilisée par des tâches ne peut pas être supprimée.`,
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.categoryService.delete(category.id)),
      )
      .subscribe({
        next: () => {
          this.notifier.success('Catégorie supprimée');
          this.load();
        },
        // 409 si des taches l'utilisent : le message du backend l'explique.
        error: (error) => this.notifier.error(error),
      });
  }

  private load(): void {
    this.loading.set(true);
    this.categoryService.findAll().subscribe({
      next: (categories) => {
        this.categories.set([...categories].sort((a, b) => a.label.localeCompare(b.label)));
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.notifier.error(error);
      },
    });
  }
}
