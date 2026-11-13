import { Dialog } from '@angular/cdk/dialog';
import { Component, OnInit, inject, signal } from '@angular/core';
import { filter, switchMap } from 'rxjs';

import { CategoryService } from '../../core/api/api.services';
import { Category, CategoryRequest } from '../../core/models';
import { Notifier } from '../../core/notifier';
import { confirm } from '../../shared/confirm-dialog';
import { Spinner } from '../../shared/spinner';
import { CategoryDialog } from './category-dialog';

@Component({
  selector: 'app-category-list-page',
  imports: [Spinner],
  template: `
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-2 mb-4 border-bottom">
      <h1 class="h3 mb-0">Catégories</h1>
      <button class="btn btn-primary" type="button" (click)="openDialog()">Nouvelle catégorie</button>
    </div>

    @if (loading()) {
      <app-spinner />
    } @else if (categories().length === 0) {
      <div class="alert alert-secondary">Aucune catégorie pour l'instant.</div>
    } @else {
      <ul class="list-group">
        @for (category of categories(); track category.id) {
          <li class="list-group-item d-flex align-items-center gap-3">
            <span class="swatch" [style.background]="category.color ?? 'transparent'"></span>
            <div class="flex-grow-1">
              <div class="category-label fw-semibold">{{ category.label }}</div>
              <small class="text-body-secondary">{{ category.color ?? 'Sans couleur' }}</small>
            </div>
            <div class="text-nowrap">
              <button class="btn btn-sm btn-outline-primary me-1" type="button" (click)="openDialog(category)">Modifier</button>
              <button class="btn btn-sm btn-outline-danger" type="button" (click)="remove(category)">Supprimer</button>
            </div>
          </li>
        }
      </ul>
    }
  `,
})
export class CategoryListPage implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(Dialog);
  private readonly notifier = inject(Notifier);

  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  openDialog(category: Category | null = null): void {
    this.dialog
      .open<CategoryRequest, Category | null>(CategoryDialog, { data: category, width: '440px', maxWidth: '95vw' })
      .closed
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
