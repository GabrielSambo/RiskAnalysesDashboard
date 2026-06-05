import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart } from '../chart/chart';
import { ContextStore } from '../core/context.store';
import { NODOS, ARISTAS, CAPAS, NodoLinaje } from '../data/lineage';

@Component({
  selector: 'app-trazabilidad',
  standalone: true,
  imports: [CommonModule, Chart],
  template: `
  <div class="page">
    <div class="page-head">
      <p>Flujo completo origen → transformación → modelo → dashboard. Pincha en un nodo para ver su detalle, sus dependencias y, aguas abajo, todo lo que se vería afectado si ese dato cambia.</p>
    </div>

    <div class="legend">
      <span class="lg" *ngFor="let c of capas"><i [style.background]="c.color"></i>{{ c.titulo }}</span>
    </div>

    <div class="grid2 lin-grid">
      <div class="card">
        <h2 class="tight">Grafo de linaje</h2>
        <p class="hint">Click en cualquier nodo · se resalta lo que hay aguas abajo</p>
        <app-chart [option]="graphOption()" height="420px" (pointClick)="onNode($event)"></app-chart>
      </div>

      <div class="card detail">
        <ng-container *ngIf="seleccion() as n; else vacio">
          <span class="pill" [style.background]="colorCapa(n.capa) + '22'" [style.color]="colorCapa(n.capa)">{{ tituloCapa(n.capa) }}</span>
          <h2 class="node-name">{{ n.nombre }}</h2>
          <p class="node-desc">{{ n.detalle }}</p>

          <h3>Dependencias (aguas arriba)</h3>
          <div class="deps" *ngIf="n.dependencias.length; else sinDeps">
            <span class="dep" *ngFor="let d of n.dependencias">{{ nombreNodo(d) }}</span>
          </div>
          <ng-template #sinDeps><p class="muted small">Nodo origen — sin dependencias.</p></ng-template>

          <h3>Aguas abajo · qué afecta</h3>
          <div class="deps" *ngIf="afecta().length; else sinDown">
            <span class="dep down" *ngFor="let nm of afecta()">{{ nm }}</span>
          </div>
          <ng-template #sinDown><p class="muted small">Nodo final — no alimenta a nadie más.</p></ng-template>

          <h3>Impacto de cambios</h3>
          <p class="impacto">{{ n.impacto }}</p>

          <button class="link-btn" *ngIf="n.link" (click)="abrirLink(n)">{{ n.link.label }} →</button>
        </ng-container>
        <ng-template #vacio>
          <div class="empty">
            <span class="empty-ico"></span>
            <p>Selecciona un nodo del grafo para ver su detalle e impacto aguas abajo.</p>
          </div>
        </ng-template>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .legend { display: flex; gap: 18px; margin-bottom: 16px; flex-wrap: wrap; }
    .lg { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--muted); }
    .lg i { width: 11px; height: 11px; border-radius: 3px; display: inline-block; }
    .lin-grid { grid-template-columns: 1.5fr 1fr; align-items: start; }
    .hint { font-size: 12px; color: var(--muted); margin: 0 0 4px; }
    .detail { min-height: 420px; }
    .node-name { font-size: 17px; margin: 12px 0 8px; }
    .node-desc { font-size: 13.5px; color: #cbd5e1; line-height: 1.6; }
    .detail h3 { font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted); margin: 20px 0 9px; }
    .deps { display: flex; flex-wrap: wrap; gap: 8px; }
    .dep { background: #0b1220; border: 1px solid var(--border); padding: 6px 11px; border-radius: 7px; font-size: 12.5px; }
    .dep.down { border-color: #2dd4bf55; color: var(--teal); }
    .impacto { font-size: 13px; color: #cbd5e1; line-height: 1.55; background: var(--panel-2); border-left: 3px solid var(--amber); padding: 10px 13px; border-radius: 0 8px 8px 0; }
    .link-btn { margin-top: 18px; width: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; padding: 11px 14px; border-radius: 9px; font-size: 13px; font-weight: 600; cursor: pointer; transition: transform .12s; }
    .link-btn:hover { transform: translateY(-1px); }
    .small { font-size: 12.5px; }
    .empty { height: 360px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--muted); }
    .empty-ico { font-size: 40px; opacity: .6; }
  `],
})
export class Trazabilidad {
  private readonly store = inject(ContextStore);
  private readonly router = inject(Router);
  readonly capas = CAPAS;

  /** Selección dirigida por el store (click o deep-link entran por el mismo sitio). */
  readonly seleccion = computed<NodoLinaje | null>(
    () => NODOS.find(n => n.id === this.store.focus().nodeId) ?? null,
  );

  /** Nombres de los nodos aguas abajo del seleccionado. */
  readonly afecta = computed(() => {
    const sel = this.seleccion();
    return sel ? [...this.downstream(sel.id)].map(id => this.nombreNodo(id)) : [];
  });

  colorCapa(capa: string) { return CAPAS.find(c => c.clave === capa)!.color; }
  tituloCapa(capa: string) { return CAPAS.find(c => c.clave === capa)!.titulo; }
  nombreNodo(id: string) { return NODOS.find(n => n.id === id)?.nombre ?? id; }

  onNode(e: { dataIndex: number }) {
    const n = NODOS[e.dataIndex];
    if (n) this.store.focusNode(n.id);
  }

  abrirLink(n: NodoLinaje) {
    const l = n.link;
    if (!l) return;
    if (l.scope) this.store.openContracts(l.scope);
    else if (l.metric && l.date) this.store.goToChartPoint(l.metric, l.date);
    else if (l.dashboard) this.router.navigate(['/dashboard']);
  }

  /** BFS hacia adelante sobre las aristas: todos los nodos alcanzables desde `id`. */
  private downstream(id: string): Set<string> {
    const out = new Set<string>();
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const [s, t] of ARISTAS) {
        if (s === cur && !out.has(t)) { out.add(t); stack.push(t); }
      }
    }
    return out;
  }

  readonly graphOption = computed(() => {
    const selId = this.store.focus().nodeId;
    const active = new Set<string>();
    if (selId) { active.add(selId); for (const d of this.downstream(selId)) active.add(d); }
    const hasSel = !!selId;
    const on = (id: string) => !hasSel || active.has(id);

    return {
      tooltip: { trigger: 'item', backgroundColor: '#0f172a', borderColor: '#334155', textStyle: { color: '#e2e8f0' }, formatter: (p: any) => p.dataType === 'node' ? p.data.name : '' },
      series: [{
        type: 'graph',
        layout: 'none',
        coordinateSystem: undefined,
        roam: false,
        symbol: 'roundRect',
        symbolSize: [128, 42],
        label: { show: true, color: '#0b1220', fontSize: 10.5, fontWeight: 600, width: 116, overflow: 'truncate' },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 9,
        lineStyle: { color: '#475569', width: 1.6, curveness: 0.08 },
        emphasis: { focus: 'adjacency', lineStyle: { width: 2.4, color: '#94a3b8' } },
        data: NODOS.map(n => ({
          name: n.nombre,
          x: n.x, y: n.y,
          itemStyle: {
            color: CAPAS.find(c => c.clave === n.capa)!.color,
            borderRadius: 8,
            opacity: on(n.id) ? 1 : 0.18,
            borderColor: n.id === selId ? '#ffffff' : 'transparent',
            borderWidth: n.id === selId ? 2.5 : 0,
          },
        })),
        links: ARISTAS.map(([s, t]) => {
          const lit = active.has(s) && active.has(t);
          return {
            source: NODOS.findIndex(n => n.id === s),
            target: NODOS.findIndex(n => n.id === t),
            lineStyle: lit
              ? { color: '#2dd4bf', width: 2.6, opacity: 1, curveness: 0.08 }
              : { color: '#475569', width: 1.6, opacity: hasSel ? 0.12 : 0.9, curveness: 0.08 },
          };
        }),
      }],
    } as any;
  });
}
