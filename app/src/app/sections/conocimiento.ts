import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from '../chart/chart';
import { ContextStore } from '../core/context.store';
import {
  PREGUNTAS_SUGERIDAS, DICCIONARIO, MENSAJE_INICIAL, RESPUESTA_VARIABLE,
  MensajeChat, VariableDef,
} from '../data/chatbot';
import { SERIE, POR_ESTADO, DRIVERS } from '../data/mock-data';

@Component({
  selector: 'app-conocimiento',
  standalone: true,
  imports: [CommonModule, Chart],
  template: `
  <div class="page">
    <div class="page-head">
      <p>Explora cada variable: su evolución, distribución, estado de calidad y dónde impacta. Pincha una variable para ver su detalle y el asistente te la explica con su origen y dependencias.</p>
    </div>

    <!-- explorador de variables (master-detail) -->
    <div class="card">
      <h2 class="tight">Explorador de variables</h2>
      <div class="grid2 expl">
        <table class="tbl">
          <thead><tr><th>Variable</th><th>Tipo</th><th>Origen</th><th>Estado</th></tr></thead>
          <tbody>
            <tr *ngFor="let d of diccionario" [class.sel]="d.variable === sel()?.variable" (click)="selectVar(d)">
              <td><code>{{ d.variable }}</code></td>
              <td><span class="pill baja">{{ d.tipo }}</span></td>
              <td class="muted">{{ d.origen }}</td>
              <td><span class="pill" [ngClass]="d.estado">{{ d.estado }}</span></td>
            </tr>
          </tbody>
        </table>

        <div class="vdetail">
          <ng-container *ngIf="sel() as v; else vacio">
            <div class="vd-head">
              <h3><code>{{ v.variable }}</code></h3>
              <span class="pill estado-pill" [ngClass]="v.estado" [class.click]="v.scope" (click)="verContratos(v)">
                estado: {{ v.estado }}<span *ngIf="v.estadoDetalle"> · {{ v.estadoDetalle }}</span><span *ngIf="v.scope"> →</span>
              </span>
            </div>
            <p class="vd-desc">{{ v.descripcion }}</p>

            <ng-container *ngIf="v.serie">
              <h4>Evolución</h4>
              <app-chart [option]="evolOption()" height="120px"></app-chart>
            </ng-container>
            <ng-container *ngIf="v.distrib">
              <h4>Distribución</h4>
              <app-chart [option]="distribOption()" height="130px"></app-chart>
            </ng-container>

            <h4>Por qué cambia · qué la afecta</h4>
            <p class="vd-why">{{ v.porque }}</p>

            <h4 *ngIf="v.usa?.length">Dónde se usa</h4>
            <div class="chips" *ngIf="v.usa?.length">
              <span class="chip" *ngFor="let u of v.usa">{{ u }}</span>
            </div>

            <button class="link-btn" *ngIf="v.nodeId" (click)="verLinaje(v)">Ver cómo se construye →</button>
          </ng-container>
          <ng-template #vacio>
            <div class="empty"><span class="empty-ico"></span><p>Selecciona una variable para explorarla.</p></div>
          </ng-template>
        </div>
      </div>
    </div>

    <!-- chatbot -->
    <div class="card chat">
      <h2 class="tight">Asistente de conocimiento del dato</h2>
      <div class="msgs">
        <div class="msg" [ngClass]="m.rol" *ngFor="let m of mensajes()">
          <div class="bubble">
            <p>{{ m.texto }}</p>
            <div class="meta" *ngIf="m.meta">
              <span class="chip" *ngFor="let x of m.meta"><b>{{ x.etiqueta }}:</b> {{ x.valor }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="suggest">
        <span class="sg-label">Preguntas sugeridas</span>
        <div class="sg-chips">
          <button *ngFor="let q of preguntas" (click)="preguntar(q.pregunta, q.respuesta)">{{ q.pregunta }}</button>
        </div>
      </div>
      <div class="composer">
        <input type="text" placeholder="Escribe tu pregunta… (demo: usa las sugeridas)" disabled />
        <button class="send" disabled>➤</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .expl { grid-template-columns: 1.1fr 1fr; align-items: start; }
    .tbl tr { cursor: pointer; }
    .tbl tr.sel { background: #6366f122; }
    .vdetail { background: var(--panel-2); border: 1px solid var(--border); border-radius: 12px; padding: 16px 18px; min-height: 320px; }
    .vd-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .vd-head h3 { margin: 0; font-size: 16px; }
    .vd-head code { background: #0b1220; padding: 2px 8px; border-radius: 6px; color: var(--blue); }
    .estado-pill.click { cursor: pointer; }
    .estado-pill.click:hover { filter: brightness(1.25); }
    .vd-desc { font-size: 13px; color: #cbd5e1; line-height: 1.55; margin: 10px 0 4px; }
    .vdetail h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted); margin: 16px 0 8px; }
    .vd-why { font-size: 13px; color: #cbd5e1; line-height: 1.55; background: #0b1220; border-left: 3px solid var(--amber); padding: 9px 12px; border-radius: 0 8px 8px 0; margin: 0; }
    .chips { display: flex; flex-wrap: wrap; gap: 7px; }
    .chip { font-size: 11px; background: #0b1220; border: 1px solid var(--border); padding: 3px 8px; border-radius: 6px; color: var(--muted); }
    .chip b { color: var(--teal); font-weight: 600; }
    .link-btn { margin-top: 16px; width: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; padding: 10px 14px; border-radius: 9px; font-size: 13px; font-weight: 600; cursor: pointer; transition: transform .12s; }
    .link-btn:hover { transform: translateY(-1px); }
    .empty { height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--muted); }
    .empty-ico { font-size: 36px; opacity: .6; }

    .chat { display: flex; flex-direction: column; max-height: 520px; }
    .msgs { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding: 6px 2px 12px; min-height: 160px; }
    .msg { display: flex; }
    .msg.usuario { justify-content: flex-end; }
    .bubble { max-width: 86%; padding: 11px 14px; border-radius: 13px; font-size: 13.5px; line-height: 1.55; }
    .msg.bot .bubble { background: var(--panel-2); border: 1px solid var(--border); border-top-left-radius: 4px; }
    .msg.usuario .bubble { background: #6366f1; color: #fff; border-top-right-radius: 4px; }
    .bubble p { margin: 0; }
    .meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .suggest { border-top: 1px solid var(--border); padding-top: 12px; }
    .sg-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted); }
    .sg-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .sg-chips button { background: var(--panel); border: 1px solid var(--border); color: var(--text); font-size: 12.5px; padding: 7px 12px; border-radius: 18px; cursor: pointer; }
    .sg-chips button:hover { border-color: var(--teal); color: var(--teal); }
    .composer { display: flex; gap: 8px; margin-top: 12px; }
    .composer input { flex: 1; background: var(--panel-2); border: 1px solid var(--border); border-radius: 9px; padding: 10px 12px; color: var(--text); font-size: 13px; }
    .send { background: #334155; border: none; color: var(--muted); width: 42px; border-radius: 9px; cursor: not-allowed; }
    code { font-size: 12px; }
  `],
})
export class Conocimiento {
  private readonly store = inject(ContextStore);
  readonly preguntas = PREGUNTAS_SUGERIDAS;
  readonly diccionario = DICCIONARIO;
  readonly mensajes = signal<MensajeChat[]>([MENSAJE_INICIAL]);

  /** Variable seleccionada, dirigida por el store (click o deep-link). */
  readonly sel = computed<VariableDef | null>(
    () => DICCIONARIO.find(d => d.variable === this.store.focus().variable) ?? null,
  );

  private sembrada: string | null = null;
  constructor() {
    // Al enfocar una variable (click o deep-link), el asistente "ya sabe" de qué hablas.
    effect(() => {
      const v = this.store.focus().variable;
      if (v && v !== this.sembrada) { this.sembrada = v; this.sembrar(v); }
    });
  }

  selectVar(v: VariableDef) { this.store.focusVariable(v.variable); }
  verLinaje(v: VariableDef) { if (v.nodeId) this.store.goToLineageNode(v.nodeId); }
  verContratos(v: VariableDef) { if (v.scope) this.store.openContracts(v.scope); }

  preguntar(texto: string, respuesta: MensajeChat) {
    this.mensajes.update(m => [...m, { rol: 'usuario', texto }, respuesta]);
  }

  /** Inyecta en el chat la respuesta contextual de la variable enfocada. */
  private sembrar(variable: string) {
    const def = DICCIONARIO.find(d => d.variable === variable);
    const respuesta: MensajeChat = RESPUESTA_VARIABLE[variable] ?? {
      rol: 'bot',
      texto: `${variable} — ${def?.descripcion ?? ''}. ${def?.porque ?? ''}`,
      meta: [
        { etiqueta: 'Origen', valor: def?.origen ?? '—' },
        { etiqueta: 'Uso', valor: (def?.usa ?? []).join(' · ') || '—' },
        { etiqueta: 'Estado', valor: def?.estado ?? '—' },
      ],
    };
    this.mensajes.update(m => [...m, { rol: 'usuario', texto: `Háblame de "${variable}"` }, respuesta]);
  }

  private axis = { axisLine: { lineStyle: { color: '#33415588' } }, axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { show: false } };
  private tip = { backgroundColor: '#0f172a', borderColor: '#334155', textStyle: { color: '#e2e8f0' } };

  readonly evolOption = computed(() => {
    const v = this.sel();
    if (!v?.serie) return {} as any;
    const data = SERIE[v.serie];
    const color = v.serie === 'lgd' ? '#2dd4bf' : v.serie === 'pd' ? '#ef4444' : '#f59e0b';
    return {
      tooltip: { trigger: 'axis', ...this.tip },
      grid: { left: 40, right: 12, top: 10, bottom: 22 },
      xAxis: { type: 'category', data: SERIE.fechas, boundaryGap: false, ...this.axis, axisLabel: { ...this.axis.axisLabel, interval: 5 } },
      yAxis: { type: 'value', scale: true, ...this.axis },
      series: [{ type: 'line', smooth: true, data, showSymbol: false, lineStyle: { color, width: 2 }, itemStyle: { color }, areaStyle: { color: color + '22' } }],
    } as any;
  });

  readonly distribOption = computed(() => {
    const v = this.sel();
    if (!v?.distrib) return {} as any;
    let cats: string[]; let vals: number[];
    if (v.distrib === 'estado') { cats = POR_ESTADO.map(s => s.estado); vals = POR_ESTADO.map(s => s.contratos); }
    else if (v.distrib === 'tipo_cliente') { const d = DRIVERS[2]; cats = d.buckets.map(b => b.etiqueta); vals = d.buckets.map(b => b.valor); }
    else { const d = DRIVERS[0]; cats = d.buckets.map(b => b.etiqueta); vals = d.buckets.map(b => b.valor); }
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...this.tip },
      grid: { left: 40, right: 12, top: 10, bottom: 22 },
      xAxis: { type: 'category', data: cats, ...this.axis },
      yAxis: { type: 'value', ...this.axis },
      series: [{ type: 'bar', data: vals, barWidth: '55%', itemStyle: { color: '#38bdf8', borderRadius: [3, 3, 0, 0] } }],
    } as any;
  });
}
