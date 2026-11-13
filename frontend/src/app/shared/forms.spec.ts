import { FormControl, Validators } from '@angular/forms';

import { emptyToNull, hexColorValidator, showError } from './forms';

describe('emptyToNull', () => {
  it('should turn empty or blank strings into null', () => {
    expect(emptyToNull('')).toBeNull();
    expect(emptyToNull('   ')).toBeNull();
    expect(emptyToNull(null)).toBeNull();
    expect(emptyToNull(undefined)).toBeNull();
  });

  it('should trim other values', () => {
    expect(emptyToNull('  Jean ')).toBe('Jean');
  });
});

describe('hexColorValidator', () => {
  it.each(['#FF0000', '#f00', '#a1B2c3'])('should accept %s', (color) => {
    expect(hexColorValidator(new FormControl(color))).toBeNull();
  });

  it.each(['red', '#FF00', 'FF0000', '#GGGGGG'])('should reject %s', (color) => {
    expect(hexColorValidator(new FormControl(color))).not.toBeNull();
  });
});

describe('showError', () => {
  it('should stay quiet for an untouched invalid field', () => {
    expect(showError(new FormControl('', Validators.required))).toBe(false);
  });

  it('should flag an invalid field once touched or modified', () => {
    const touched = new FormControl('', Validators.required);
    touched.markAsTouched();
    const dirty = new FormControl('', Validators.required);
    dirty.markAsDirty();

    expect(showError(touched)).toBe(true);
    expect(showError(dirty)).toBe(true);
  });

  it('should not flag a valid field', () => {
    const control = new FormControl('ok', Validators.required);
    control.markAsTouched();

    expect(showError(control)).toBe(false);
  });
});
