import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title fs-5">{{ data.title }}</h2>
      </div>
      <div class="modal-body">{{ data.message }}</div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="dialogRef.close(false)">Annuler</button>
        <button type="button" class="btn btn-danger" (click)="dialogRef.close(true)">
          {{ data.confirmLabel ?? 'Supprimer' }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);
  protected readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);
}

/** Ouvre la boite de confirmation ; emet true uniquement si l'utilisateur confirme. */
export function confirm(dialog: Dialog, data: ConfirmDialogData): Observable<boolean> {
  return dialog
    .open<boolean, ConfirmDialogData>(ConfirmDialog, { data, width: '420px', maxWidth: '95vw' })
    .closed.pipe(map((result) => result === true));
}
