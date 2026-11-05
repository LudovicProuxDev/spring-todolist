import { Pipe, PipeTransform } from '@angular/core';

import { Role } from '../core/models';

const LABELS: Record<Role, string> = {
  ROLE_USER: 'Utilisateur',
  ROLE_ADMIN: 'Administrateur',
};

@Pipe({ name: 'roleLabel' })
export class RoleLabelPipe implements PipeTransform {
  transform(role: Role): string {
    return LABELS[role] ?? role;
  }
}
