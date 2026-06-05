import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextStore } from '../core/context.store';
import { CHECKS, Check } from '../data/calidad';

@Component({
  selector: 'app-calidad',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="page">
    <div class="page-head">
      <p>Checks automáticos de completitud, unicidad, coherencia y reglas de negocio, priorizados por criticidad. Pincha un problema para ver los contratos afectados, o abre el agente para el resumen y las causas.</p>
    </div>

    <div class="summary">
      <div class="sum ok"><span class="n">{{ countOk }}</span><span>OK</span></div>
      <div class="sum warning"><span class="n">{{ countWarn }}</span><span>Warnings</span></div>
      <div class="sum error"><span class="n">{{ countErr }}</span><span>Errores</span></div>
      <button class="agent-btn" (click)="abrirAgente()">
        <span class="pulse"></span> Analizar con agente
      </button>
    </div>

    <div class="headline" *ngIf="critico as c">
      <span class="hl-ico">🔴</span>
      <span>Lo más crítico ahora: <strong>{{ c.nombre }}</strong> — {{ c.detalle }}
        <span class="hl-cta" *ngIf="c.scope" (click)="verContratos(c)">ver contratos →</span></span>
    </div>

    <section class="section">
      <div class="section-head">
        <h2>Data Quality</h2>
        <p class="hint">Controles técnicos del dato: missing, duplicados, valores fuera de rango, tipos y valores inválidos.</p>
      </div>
      <div class="card group" *ngFor="let g of qualityGroups">
        <h2 class="ghead"><span class="gdot" [ngClass]="g.nivel"></span> {{ g.titulo }} <span class="gcount">{{ g.items.length }}</span></h2>
        <table class="tbl" *ngIf="g.items.length; else vacio">
          <thead><tr><th>Categoría</th><th>Check</th><th>Detalle</th><th>Afectados</th><th>Impacto</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let c of g.items" [class.clickable]="c.scope" (click)="verContratos(c)">
              <td>{{ c.categoria }}</td>
              <td><strong>{{ c.nombre }}</strong></td>
              <td class="muted">{{ c.detalle }}</td>
              <td class="mono">{{ c.afectados }}</td>
              <td class="muted">{{ c.impacto }}</td>
              <td class="acc">{{ c.scope ? 'ver contratos →' : '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Reglas de negocio</h2>
        <p class="hint">Controles basados en la lógica de negocio y el riesgo: default, coherencia PD/LGD/default y reglas de eventos.</p>
      </div>
      <div class="card group" *ngFor="let g of businessGroups">
        <h2 class="ghead"><span class="gdot" [ngClass]="g.nivel"></span> {{ g.titulo }} <span class="gcount">{{ g.items.length }}</span></h2>
        <table class="tbl" *ngIf="g.items.length; else vacio">
          <thead><tr><th>Categoría</th><th>Check</th><th>Detalle</th><th>Afectados</th><th>Impacto</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let c of g.items" [class.clickable]="c.scope" (click)="verContratos(c)">
              <td>{{ c.categoria }}</td>
              <td><strong>{{ c.nombre }}</strong></td>
              <td class="muted">{{ c.detalle }}</td>
              <td class="mono">{{ c.afectados }}</td>
              <td class="muted">{{ c.impacto }}</td>
              <td class="acc">{{ c.scope ? 'ver contratos →' : '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ng-template #vacio><p class="muted empty">Sin elementos.</p></ng-template>
  </div>
  `,
  styles: [`
    .summary { display: flex; gap: 14px; align-items: center; margin-bottom: 18px; flex-wrap: wrap; }
    .sum { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 12px 20px; display: flex; flex-direction: column; align-items: center; min-width: 92px; }
    .sum .n { font-size: 26px; font-weight: 700; }
    .sum span:last-child { font-size: 11.5px; color: var(--muted); }
    .sum.ok { border-color: #2dd4bf44; } .sum.ok .n { color: var(--teal); }
    .sum.warning { border-color: #f59e0b44; } .sum.warning .n { color: var(--amber); }
    .sum.error { border-color: #ef444444; } .sum.error .n { color: var(--red); }
    .agent-btn { margin-left: auto; display: flex; align-items: center; gap: 9px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; padding: 12px 18px; border-radius: 10px; font-size: 13.5px; font-weight: 600; cursor: pointer; box-shadow: 0 6px 18px -6px #6366f1aa; }
    .agent-btn:hover { transform: translateY(-1px); }
    .pulse { width: 9px; height: 9px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 0 0 #4ade8099; animation: pulse 1.8s infinite; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 #4ade8099; } 70% { box-shadow: 0 0 0 8px #4ade8000; } 100% { box-shadow: 0 0 0 0 #4ade8000; } }
    .headline { display: flex; align-items: flex-start; gap: 10px; background: #ef44441a; border: 1px solid #ef444455; border-radius: 11px; padding: 12px 16px; margin-bottom: 18px; font-size: 13.5px; line-height: 1.5; }
    .hl-cta, .acc { color: #818cf8; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .section { margin-bottom: 30px; }
    .section-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; margin-bottom: 14px; }
    .section-head h2 { margin: 0; font-size: 16px; }
    .section-head .hint { margin: 0; }
    .group { margin-bottom: 16px; }
    .ghead { display: flex; align-items: center; gap: 10px; font-size: 14px; margin: 0 0 12px; }
    .gdot { width: 10px; height: 10px; border-radius: 50%; }
    .gdot.error { background: var(--red); } .gdot.warning { background: var(--amber); } .gdot.ok { background: var(--teal); }
    .gcount { font-size: 12px; color: var(--muted); background: var(--panel-2); border: 1px solid var(--border); border-radius: 20px; padding: 1px 9px; }
    .tbl tr.clickable { cursor: pointer; }
    .tbl tr.clickable:hover { background: #1e293b66; }
    .acc { font-size: 12px; text-align: right; }
    .empty { font-size: 12.5px; margin: 0; }
  `],
})
export class Calidad {
  private readonly store = inject(ContextStore);
  readonly countOk = CHECKS.filter(c => c.resultado === 'ok').length;
  readonly countWarn = CHECKS.filter(c => c.resultado === 'warning').length;
  readonly countErr = CHECKS.filter(c => c.resultado === 'error').length;

  /** El primer error es "lo más crítico ahora". */
  readonly critico = CHECKS.find(c => c.resultado === 'error') ?? null;

  /** Checks agrupados por criticidad; los warnings ordenados por nº de afectados. */
  readonly qualityChecks = CHECKS.filter(c => [
    'Valores missing',
    'Duplicados',
    'PD válida (0–1)',
    'Contratos esperados',
  ].includes(c.nombre));

  readonly businessChecks = CHECKS.filter(c => [
    'Default vs estado',
    'Regla DPD > 90 → default',
    'Comparativa PD vs LGD',
  ].includes(c.nombre));

  readonly qualityGroups = [
    { nivel: 'error', titulo: 'Críticos', items: this.qualityChecks.filter(c => c.resultado === 'error') },
    { nivel: 'warning', titulo: 'Secundarios', items: this.qualityChecks.filter(c => c.resultado === 'warning').sort((a, b) => b.afectados - a.afectados) },
    { nivel: 'ok', titulo: 'OK', items: this.qualityChecks.filter(c => c.resultado === 'ok') },
  ];

  readonly businessGroups = [
    { nivel: 'error', titulo: 'Críticos', items: this.businessChecks.filter(c => c.resultado === 'error') },
    { nivel: 'warning', titulo: 'Secundarios', items: this.businessChecks.filter(c => c.resultado === 'warning').sort((a, b) => b.afectados - a.afectados) },
    { nivel: 'ok', titulo: 'OK', items: this.businessChecks.filter(c => c.resultado === 'ok') },
  ];

  abrirAgente() { this.store.openAgent(); }
  verContratos(c: Check) { if (c.scope) this.store.openContracts(c.scope); }
}
