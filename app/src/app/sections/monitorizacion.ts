import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from '../chart/chart';
import { ContextStore } from '../core/context.store';
import { SERIE, DATA_DRIFT } from '../data/mock-data';
import {
  INCONSISTENCIAS, COMPARATIVA_VENTANAS, COMPOSICION, PSI_VARIABLES,
  RESUMEN_PERIODO, DRIFT_INTERPRETACION, MonitorTarget,
} from '../data/monitor';

const SEV_ORDEN: Record<string, number> = { alta: 0, media: 1, baja: 2 };

@Component({
  selector: 'app-monitorizacion',
  standalone: true,
  imports: [CommonModule, Chart],
  template: `
  <div class="page">
    <div class="page-head">
    </div>

    <!-- resumen del periodo (negocio) -->
    <div class="card resumen">
      <h2 class="tight">Resumen del periodo · {{ cmp.ventanaA.etiqueta }} → {{ cmp.ventanaB.etiqueta }}</h2>
      <p class="res-txt">{{ resumen.texto }}</p>
      <div class="drivers">
        <div class="driver" *ngFor="let d of resumen.drivers" [class.clickable]="d.target" (click)="go(d.target)">
          <span class="dnum">▸</span><span>{{ d.texto }}<span class="cta" *ngIf="d.target"> →</span></span>
        </div>
      </div>
    </div>

    <!-- comparativa de ventanas (clickable → explicación) -->
    <div class="card">
      <h2>Comparativa de ventanas <span class="hint-inline">· pincha una métrica para ver por qué cambió</span></h2>
      <div class="cmp-grid">
        <div class="cmp" *ngFor="let m of metricas" [class.clickable]="m.target" (click)="go(m.target)">
          <span class="cmp-label">{{ m.label }}</span>
          <div class="cmp-vals">
            <span class="va">{{ m.a }}{{ m.suf }}</span>
            <span class="arrow">→</span>
            <span class="vb">{{ m.b }}{{ m.suf }}</span>
          </div>
          <span class="delta" [class.up]="m.delta > 0" [class.down]="m.delta < 0">
            {{ m.delta > 0 ? '▲' : '▼' }} {{ m.deltaTxt }}
          </span>
          <span class="cmp-cta" *ngIf="m.target">por qué →</span>
        </div>
      </div>
    </div>

    <!-- drift interpretado (negocio; PSI como detalle) -->
    <div class="card">
      <div class="panel-head">
        <h2>Drift interpretado · {{ drift.variable }}</h2>
        <span class="psi-badge" [ngClass]="di.nivel">PSI {{ di.psi.toFixed(2) }} · {{ di.nivel }}</span>
      </div>
      <p class="res-txt">{{ di.texto }}</p>
      <app-chart [option]="driftShiftOption()" height="240px"></app-chart>
    </div>

    <!-- inconsistencias priorizadas (clickable → contratos) -->
    <div class="card">
      <h2>Principales inconsistencias <span class="hint-inline">· ordenadas por severidad · pincha para ver contratos</span></h2>
      <table class="tbl">
        <thead><tr><th>Sev.</th><th>Tipo</th><th>Descripción</th><th>Casos</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let i of inconsistencias" [class.clickable]="i.scope" (click)="verContratos(i)">
            <td><span class="pill" [ngClass]="i.severidad">{{ i.severidad }}</span></td>
            <td><strong>{{ i.tipo }}</strong></td>
            <td class="muted">{{ i.descripcion }}</td>
            <td class="mono">{{ i.casos }}</td>
            <td class="acc">{{ i.scope ? 'ver contratos →' : '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- detalle técnico -->
    <h3 class="tech-sep">Detalle técnico</h3>
    <div class="grid2">
      <div class="card">
        <h2>Seguimiento temporal PD vs LGD</h2>
        <app-chart [option]="trackOption()" height="280px"></app-chart>
      </div>
      <div class="card">
        <h2>Composición de cartera por estado (drift)</h2>
        <app-chart [option]="compOption()" height="280px"></app-chart>
      </div>
    </div>
    <div class="card">
      <h2>Data drift · PSI por variable</h2>
      <app-chart [option]="psiOption()" height="240px"></app-chart>
      <p class="legend-note"><i class="dot ok"></i> &lt; 0,10 estable &nbsp; <i class="dot warning"></i> 0,10–0,25 moderado &nbsp; <i class="dot error"></i> &gt; 0,25 alto</p>
    </div>
  </div>
  `,
  styles: [`
    .resumen .res-txt, .res-txt { font-size: 13.5px; color: #cbd5e1; line-height: 1.65; margin: 4px 0 14px; }
    .drivers { display: flex; flex-direction: column; gap: 8px; }
    .driver { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: #cbd5e1; padding: 8px 10px; border-radius: 8px; background: var(--panel-2); border: 1px solid var(--border); }
    .driver .dnum { color: var(--amber); }
    .driver.clickable { cursor: pointer; } .driver.clickable:hover { border-color: #6366f1aa; }
    .cta, .cmp-cta, .acc { color: #818cf8; font-weight: 600; }
    .hint-inline { font-size: 12px; color: var(--muted); font-weight: 400; }
    .cmp-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .cmp { background: var(--panel-2); border: 1px solid var(--border); border-radius: 11px; padding: 14px 16px; position: relative; }
    .cmp.clickable { cursor: pointer; } .cmp.clickable:hover { border-color: #6366f1aa; }
    .cmp-label { font-size: 12px; color: var(--muted); }
    .cmp-vals { display: flex; align-items: baseline; gap: 8px; margin: 8px 0 6px; }
    .cmp-vals .va { font-size: 16px; color: var(--muted); }
    .cmp-vals .arrow { color: #475569; }
    .cmp-vals .vb { font-size: 22px; font-weight: 700; }
    .delta { font-size: 12px; font-weight: 600; }
    .delta.up { color: var(--amber); } .delta.down { color: var(--teal); }
    .cmp-cta { display: block; margin-top: 8px; font-size: 11px; }
    .panel-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .psi-badge { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; background: #33415544; color: var(--muted); }
    .psi-badge.alto { background: #ef444422; color: var(--red); }
    .tbl tr.clickable { cursor: pointer; } .tbl tr.clickable:hover { background: #1e293b66; }
    .acc { font-size: 12px; text-align: right; }
    .tech-sep { font-size: 12px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--muted); margin: 26px 0 12px; border-top: 1px solid var(--border); padding-top: 16px; }
    .legend-note { font-size: 11.5px; color: var(--muted); margin: 10px 0 0; }
    .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 3px; }
    .dot.ok { background: var(--teal); } .dot.warning { background: var(--amber); } .dot.error { background: var(--red); }
    @media (max-width: 940px) { .cmp-grid { grid-template-columns: 1fr 1fr; } }
  `],
})
export class Monitorizacion {
  private readonly store = inject(ContextStore);
  readonly cmp = COMPARATIVA_VENTANAS;
  readonly drift = DATA_DRIFT;
  readonly resumen = RESUMEN_PERIODO;
  readonly di = DRIFT_INTERPRETACION;

  /** Inconsistencias ordenadas por severidad y nº de casos. */
  readonly inconsistencias = INCONSISTENCIAS.slice().sort(
    (a, b) => (SEV_ORDEN[a.severidad] - SEV_ORDEN[b.severidad]) || (b.casos - a.casos),
  );

  readonly metricas = [
    { label: 'PD media', a: this.fmt(COMPARATIVA_VENTANAS.ventanaA.pd), b: this.fmt(COMPARATIVA_VENTANAS.ventanaB.pd), suf: '%', delta: COMPARATIVA_VENTANAS.ventanaB.pd - COMPARATIVA_VENTANAS.ventanaA.pd, deltaTxt: '+0,33 pp', target: { metric: 'pd', date: '2025-03' } as MonitorTarget },
    { label: 'LGD media', a: this.fmt(COMPARATIVA_VENTANAS.ventanaA.lgd), b: this.fmt(COMPARATIVA_VENTANAS.ventanaB.lgd), suf: '%', delta: COMPARATIVA_VENTANAS.ventanaB.lgd - COMPARATIVA_VENTANAS.ventanaA.lgd, deltaTxt: '-6,0 pp', target: { metric: 'lgd', date: '2025-07' } as MonitorTarget },
    { label: 'Defaults / mes', a: '' + COMPARATIVA_VENTANAS.ventanaA.defaults, b: '' + COMPARATIVA_VENTANAS.ventanaB.defaults, suf: '', delta: COMPARATIVA_VENTANAS.ventanaB.defaults - COMPARATIVA_VENTANAS.ventanaA.defaults, deltaTxt: '+54', target: { metric: 'defaults', date: '2025-03' } as MonitorTarget },
    { label: 'Contratos', a: '12.410', b: '12.930', suf: '', delta: 520, deltaTxt: '+520', target: undefined as MonitorTarget | undefined },
  ];

  private fmt(n: number) { return n.toFixed(n % 1 === 0 ? 0 : 1).replace('.', ','); }

  go(t?: MonitorTarget) {
    if (!t) return;
    if (t.metric && t.date) this.store.goToChartPoint(t.metric, t.date);
    else if (t.scope) this.store.openContracts(t.scope);
  }
  verContratos(i: { scope?: string }) { if (i.scope) this.store.openContracts(i.scope); }

  private axis = { axisLine: { lineStyle: { color: '#33415588' } }, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } };
  private tip = { backgroundColor: '#0f172a', borderColor: '#334155', textStyle: { color: '#e2e8f0' } };

  readonly driftShiftOption = computed(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.tip },
    legend: { data: [DATA_DRIFT.ventanaA, DATA_DRIFT.ventanaB], textStyle: { color: '#cbd5e1' }, top: 0 },
    grid: { left: 44, right: 20, top: 34, bottom: 30 },
    xAxis: { type: 'category', data: DATA_DRIFT.bins.map(b => b.bucket), name: 'Score', ...this.axis },
    yAxis: { type: 'value', name: '% cartera', ...this.axis },
    series: [
      { name: DATA_DRIFT.ventanaA, type: 'bar', data: DATA_DRIFT.bins.map(b => b.ventanaA), itemStyle: { color: '#475569', borderRadius: [3, 3, 0, 0] } },
      { name: DATA_DRIFT.ventanaB, type: 'bar', data: DATA_DRIFT.bins.map(b => b.ventanaB), itemStyle: { color: '#f59e0b', borderRadius: [3, 3, 0, 0] } },
    ],
  } as any));

  readonly trackOption = computed(() => ({
    tooltip: { trigger: 'axis', ...this.tip },
    legend: { data: ['PD media', 'LGD media'], textStyle: { color: '#cbd5e1' }, top: 0 },
    grid: { left: 44, right: 44, top: 34, bottom: 30 },
    xAxis: { type: 'category', data: SERIE.fechas, boundaryGap: false, ...this.axis },
    yAxis: [
      { type: 'value', name: 'PD %', scale: true, ...this.axis },
      { type: 'value', name: 'LGD %', scale: true, ...this.axis, splitLine: { show: false } },
    ],
    series: [
      { name: 'PD media', type: 'line', smooth: true, data: SERIE.pd, lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' } },
      { name: 'LGD media', type: 'line', yAxisIndex: 1, smooth: true, data: SERIE.lgd, lineStyle: { color: '#2dd4bf', width: 2 }, itemStyle: { color: '#2dd4bf' } },
    ],
  } as any));

  readonly compOption = computed(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.tip },
    legend: { data: ['2024 H2', '2025 H2'], textStyle: { color: '#cbd5e1' }, top: 0 },
    grid: { left: 44, right: 20, top: 34, bottom: 30 },
    xAxis: { type: 'category', data: COMPOSICION.estados, ...this.axis },
    yAxis: { type: 'value', name: '%', ...this.axis },
    series: [
      { name: '2024 H2', type: 'bar', data: COMPOSICION.ventanaA, itemStyle: { color: '#475569', borderRadius: [3, 3, 0, 0] } },
      { name: '2025 H2', type: 'bar', data: COMPOSICION.ventanaB, itemStyle: { color: '#f59e0b', borderRadius: [3, 3, 0, 0] } },
    ],
  } as any));

  readonly psiOption = computed(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.tip },
    grid: { left: 130, right: 24, top: 12, bottom: 24 },
    xAxis: { type: 'value', ...this.axis },
    yAxis: { type: 'category', data: PSI_VARIABLES.map(p => p.variable).reverse(), ...this.axis, splitLine: { show: false } },
    series: [{
      type: 'bar', barWidth: '55%',
      data: PSI_VARIABLES.slice().reverse().map(p => ({
        value: p.psi,
        itemStyle: { color: p.psi > 0.25 ? '#ef4444' : p.psi >= 0.10 ? '#f59e0b' : '#2dd4bf', borderRadius: [0, 4, 4, 0] },
      })),
      label: { show: true, position: 'right', color: '#cbd5e1', formatter: (p: any) => p.value.toFixed(2) },
    }],
  } as any));
}
