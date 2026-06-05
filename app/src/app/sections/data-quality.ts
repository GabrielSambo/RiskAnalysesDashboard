import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextStore } from '../core/context.store';
import { runDataQualityChecks } from '../data/data-quality';
import { CONTRATOS } from '../data/contratos';
import { Check } from '../data/calidad';

@Component({
  selector: 'app-data-quality',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="page">
    <div class="page-head">
      <h1>Data Quality (DQ)</h1>
      <p>Controles técnicos y genéricos de calidad de datos: missing, duplicados, tipos, rango y consistencia. Este módulo es independiente del negocio y reutilizable para cualquier dataset.</p>
    </div>

    <div class="summary">
      <div class="sum ok"><span class="n">{{ summary.okCount }}</span><span>OK</span></div>
      <div class="sum warning"><span class="n">{{ summary.warningCount }}</span><span>Warnings</span></div>
      <div class="sum error"><span class="n">{{ summary.errorCount }}</span><span>Errores</span></div>
      <div class="sum info"><span class="n">{{ summary.totalChecks }}</span><span>Controles</span></div>
    </div>

    <div class="card group" *ngFor="let g of groups">
      <h2 class="ghead"><span class="gdot" [ngClass]="g.nivel"></span> {{ g.titulo }} <span class="gcount">{{ g.items.length }}</span></h2>
      <table class="tbl" *ngIf="g.items.length; else vacio">
        <thead><tr><th>Control</th><th>Detalle</th><th>Impacto</th><th>Afectados</th></tr></thead>
        <tbody>
          <tr *ngFor="let c of g.items">
            <td><strong>{{ c.nombre }}</strong></td>
            <td class="muted">{{ c.detalle }}</td>
            <td class="muted">{{ c.impacto }}</td>
            <td class="mono">{{ c.afectados }}</td>
          </tr>
        </tbody>
      </table>
      <ng-template #vacio><p class="muted empty">Sin elementos.</p></ng-template>
    </div>
  </div>
  `,
  styles: [`
    .summary { display: flex; gap: 14px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
    .sum { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 14px 20px; display: flex; flex-direction: column; align-items: center; min-width: 100px; }
    .sum .n { font-size: 28px; font-weight: 700; }
    .sum span:last-child { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; }
    .sum.ok { border-color: #2dd4bf44; } .sum.ok .n { color: var(--teal); }
    .sum.warning { border-color: #f59e0b44; } .sum.warning .n { color: var(--amber); }
    .sum.error { border-color: #ef444444; } .sum.error .n { color: var(--red); }
    .sum.info { border-color: #94a3b844; } .sum.info .n { color: var(--text); }
    .section-head h1 { margin: 0 0 10px; font-size: 24px; }
    .section-head p { margin: 0; color: var(--muted); max-width: 760px; line-height: 1.6; }
    .group { margin-bottom: 18px; }
    .ghead { display: flex; align-items: center; gap: 10px; font-size: 15px; margin: 0 0 12px; }
    .gdot { width: 10px; height: 10px; border-radius: 50%; }
    .gdot.error { background: var(--red); } .gdot.warning { background: var(--amber); } .gdot.ok { background: var(--teal); }
    .gcount { font-size: 12px; color: var(--muted); background: var(--panel-2); border: 1px solid var(--border); border-radius: 20px; padding: 1px 10px; }
    .tbl th, .tbl td { padding: 12px 10px; text-align: left; }
    .tbl tbody tr:nth-child(even) { background: rgba(148, 163, 184, 0.03); }
    .mono { font-family: ui-monospace, monospace; }
  `],
})
export class DataQuality {
  readonly summary = runDataQualityChecks(CONTRATOS);
  readonly groups = [
    { nivel: 'error', titulo: 'Errores', items: this.summary.checks.filter(c => c.resultado === 'error') },
    { nivel: 'warning', titulo: 'Warnings', items: this.summary.checks.filter(c => c.resultado === 'warning') },
    { nivel: 'ok', titulo: 'OK', items: this.summary.checks.filter(c => c.resultado === 'ok') },
  ];

  get countOk() { return this.summary.okCount; }
  get countWarn() { return this.summary.warningCount; }
  get countErr() { return this.summary.errorCount; }
  get totalChecks() { return this.summary.totalChecks; }
}
