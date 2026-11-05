import { Validators } from '@angular/forms';

/** Le backend attend null (et non "") pour un champ optionnel laisse vide. */
export function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

/** Meme regle que CategoryRequest.color cote backend : #RGB ou #RRGGBB. */
export const HEX_COLOR_PATTERN = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const hexColorValidator = Validators.pattern(HEX_COLOR_PATTERN);
