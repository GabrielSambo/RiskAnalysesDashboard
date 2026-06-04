import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextStore } from '../core/context.store';
import { contractsFor } from '../data/contratos';

/**
 * Modal compartido de drill-down a contratos. Se monta una vez en el layout y se
 * abre desde cualquier sección con `store.openContracts(scope)`. Lee la muestra de
 * contratos del scope enfocado y la lista.
 */
@Component({
  selector: 'app-contracts-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="modal-wrap" *ngIf="view() as cv" (click)="close()">
    <div class="modal" (click)="$event.stopPropagation()">
      <div class="modal-head">
        <div>
          <h3>{{ cv.meta?.label }}</h3>
          <p class="modal-desc">{{ cv.meta?.descripcion }}</p>
          <span class="modal-count">Mostrando {{ cv.rows.length }} de {{ cv.total }} expedientes</span>
        </div>
        <button class="x" (click)="close()">✕</button>
      </div>
      <div class="modal-body">
        <table class="tbl contratos">
          <thead>
            <tr>
              <th>Expediente</th><th>Estado</th><th>Segmento</th><th>Cliente</th>
              <th>DPD</th><th>Default</th><th>PD</th><th>LGD</th><th>EAD (€)</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of cv.rows">
              <td><code>{{ r.id }}</code></td>
              <td>{{ r.estado }}</td>
              <td class="muted">{{ r.segmento }}</td>
              <td class="muted">{{ r.tipo_cliente }}</td>
              <td class="mono">{{ r.dpd }}</td>
              <td class="mono"><span class="pill" [ngClass]="r.default ? 'error' : 'ok'">{{ r.default }}</span></td>
              <td class="mono">{{ r.pd }} %</td>
              <td class="mono">{{ r.lgd === null ? '—' : r.lgd + ' %' }}</td>
              <td class="mono">{{ r.ead.toLocaleString('es-ES') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="modal-foot">Muestra representativa · valores simulados.</p>
    </div>
  </div>
  `,
  styles: [`
    .modal-wrap { position: fixed; inset: 0; z-index: 12; background: #00000088; display: flex; align-items: center; justify-content: center; padding: 24px; animation: fade .2s; }
    .modal { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; width: 920px; max-width: 96vw; max-height: 86vh; display: flex; flex-direction: column; box-shadow: 0 24px 60px -20px #000; }
    .modal-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; padding: 18px 22px; border-bottom: 1px solid var(--border); }
    .modal-head h3 { margin: 0 0 4px; font-size: 16px; }
    .modal-desc { margin: 0 0 6px; font-size: 12.5px; color: var(--muted); line-height: 1.5; max-width: 640px; }
    .modal-count { font-size: 12px; font-weight: 600; color: var(--teal); }
    .modal-body { overflow: auto; padding: 6px 22px 14px; }
    .contratos code { background: var(--panel-2); padding: 2px 6px; border-radius: 5px; font-size: 12px; color: #60a5fa; }
    .contratos td, .contratos th { white-space: nowrap; }
    .x { background: none; border: none; color: var(--muted); font-size: 16px; cursor: pointer; }
    .modal-foot { margin: 0; padding: 12px 22px 16px; font-size: 11.5px; color: #64748b; font-style: italic; border-top: 1px solid var(--border); }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  `],
})
export class ContractsModal {
  private readonly store = inject(ContextStore);
  readonly view = computed(() => {
    const s = this.store.focus().scope;
    return s ? contractsFor(s) : null;
  });
  close() { this.store.openContracts(null); }
}
