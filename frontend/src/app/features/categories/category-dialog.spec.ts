import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Category } from '../../core/models';
import { CategoryDialog } from './category-dialog';

describe('CategoryDialog', () => {
  let close: ReturnType<typeof vi.fn>;

  function create(category: Category | null) {
    close = vi.fn();
    TestBed.configureTestingModule({
      imports: [CategoryDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: category },
        { provide: MatDialogRef, useValue: { close } },
      ],
    });
    const fixture = TestBed.createComponent(CategoryDialog);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as { form: any; save(): void; pickerValue(): string };
  }

  it('should prefill the form when editing', () => {
    const dialog = create({ id: 1, label: 'Maison', color: '#00AA00' });

    expect(dialog.form.getRawValue()).toEqual({ label: 'Maison', color: '#00AA00' });
  });

  it('should return a trimmed label and a null colour when left empty', () => {
    const dialog = create(null);
    dialog.form.patchValue({ label: '  Urgent ', color: '' });

    dialog.save();

    expect(close).toHaveBeenCalledWith({ label: 'Urgent', color: null });
  });

  it('should refuse a missing label', () => {
    const dialog = create(null);

    dialog.save();

    expect(close).not.toHaveBeenCalled();
  });

  it('should refuse a colour that is not a hex code', () => {
    const dialog = create(null);
    dialog.form.patchValue({ label: 'Urgent', color: 'rouge' });

    dialog.save();

    expect(close).not.toHaveBeenCalled();
  });

  it('should only give the native picker a #RRGGBB value', () => {
    const dialog = create(null);

    dialog.form.patchValue({ color: '#f00' });
    expect(dialog.pickerValue()).toBe('#3f51b5');

    dialog.form.patchValue({ color: '#FF0000' });
    expect(dialog.pickerValue()).toBe('#FF0000');
  });
});
