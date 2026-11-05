import { FormControl } from '@angular/forms';

import { emptyToNull, hexColorValidator } from './forms';

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
