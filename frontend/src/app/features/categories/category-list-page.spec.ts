import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { dialogMock, notifierMock } from '../../../testing/mocks';
import { CategoryService } from '../../core/api/api.services';
import { Category } from '../../core/models';
import { CategoryDialog } from './category-dialog';
import { CategoryListPage } from './category-list-page';

describe('CategoryListPage', () => {
  const categories: Category[] = [
    { id: 2, label: 'Travail', color: '#3366FF' },
    { id: 1, label: 'Maison', color: null },
  ];

  let categoryService: Record<'findAll' | 'create' | 'update' | 'delete', ReturnType<typeof vi.fn>>;

  async function render(...dialogResults: unknown[]) {
    categoryService = {
      findAll: vi.fn(() => of(categories)),
      create: vi.fn(() => of(categories[0])),
      update: vi.fn(() => of(categories[0])),
      delete: vi.fn(() => of(undefined)),
    };
    const dialog = dialogMock(...dialogResults);
    const { notifier, provider } = notifierMock();
    TestBed.configureTestingModule({
      imports: [CategoryListPage],
      providers: [{ provide: CategoryService, useValue: categoryService }, dialog.provider, provider],
    });
    const fixture = TestBed.createComponent(CategoryListPage);
    await fixture.whenStable();
    return { element: fixture.nativeElement as HTMLElement, component: fixture.componentInstance, dialog, notifier };
  }

  it('should list categories sorted by label, with their colour', async () => {
    const { element } = await render();

    const titles = Array.from(element.querySelectorAll('[matListItemTitle]')).map((e) => e.textContent!.trim());
    expect(titles).toEqual(['Maison', 'Travail']);
    expect(element.textContent).toContain('Sans couleur');
    expect(element.textContent).toContain('#3366FF');
  });

  it('should create a category from the dialog', async () => {
    const { component, dialog, notifier } = await render({ label: 'Urgent', color: '#FF0000' });

    component.openDialog();

    expect(dialog.open).toHaveBeenCalledWith(CategoryDialog, expect.objectContaining({ data: null }));
    expect(categoryService.create).toHaveBeenCalledWith({ label: 'Urgent', color: '#FF0000' });
    expect(notifier.success).toHaveBeenCalledWith('Catégorie créée');
    expect(categoryService.findAll).toHaveBeenCalledTimes(2);
  });

  it('should update an existing category', async () => {
    const { component } = await render({ label: 'Pro', color: null });

    component.openDialog(categories[0]);

    expect(categoryService.update).toHaveBeenCalledWith(2, { label: 'Pro', color: null });
  });

  it('should delete after confirmation', async () => {
    const { component, notifier } = await render(true);

    component.remove(categories[1]);

    expect(categoryService.delete).toHaveBeenCalledWith(1);
    expect(notifier.success).toHaveBeenCalledWith('Catégorie supprimée');
  });

  it('should show the API message when the category is still used (409)', async () => {
    const { component, notifier } = await render(true);
    const conflict = new HttpErrorResponse({ status: 409, error: { status: 409, message: 'Catégorie utilisée' } });
    categoryService.delete.mockReturnValue(throwError(() => conflict));

    component.remove(categories[1]);

    expect(notifier.error).toHaveBeenCalledWith(conflict);
  });

  it('should not delete when the confirmation is refused', async () => {
    const { component } = await render(false);

    component.remove(categories[1]);

    expect(categoryService.delete).not.toHaveBeenCalled();
  });

  it('should report an error when categories cannot be loaded', async () => {
    const error = new HttpErrorResponse({ status: 0 });
    TestBed.overrideProvider(CategoryService, { useValue: { findAll: () => throwError(() => error) } });
    const { element, notifier } = await render();

    expect(notifier.error).toHaveBeenCalledWith(error);
    expect(element.querySelector('mat-progress-bar')).toBeNull();
  });
});
