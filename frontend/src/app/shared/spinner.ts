import { Component } from '@angular/core';

/** Indicateur de chargement (spinner Bootstrap). */
@Component({
  selector: 'app-spinner',
  template: `
    <div class="d-flex justify-content-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement…</span>
      </div>
    </div>
  `,
})
export class Spinner {}
