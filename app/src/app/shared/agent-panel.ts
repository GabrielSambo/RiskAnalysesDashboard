import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextStore } from '../core/context.store';
import { ALERTAS, Alerta } from '../data/mock-data';
import { AGENTE_RESUMEN, AgenteTarget } from '../data/calidad';

/**
 * Panel del agente / sensor de calidad, COMPARTIDO entre el dashboard y la sección de
 * calidad ("no panel separado"). Se monta una vez en el layout y se abre con
 * `store.openAgent()`. Combina:
 *   - sensor de alertas (clic → salta al gráfico/dato afectado)
 *   - análisis del agente: problemas priorizados, cambios relevantes y causas
 *   - umbrales configurados
 */
@Component({
  selector: 'app-agent-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
  <aside class="sidepanel" [class.open]="store.agentOpen()">
    <div class="sp-head">
      <h3><span class="pulse"></span> Agente / sensor de calidad</h3>
      <button class="x" (click)="store.closeAgent()">✕</button>
    </div>
    <div class="sp-body">
      <p class="sp-intro">Monitorización continua con umbrales configurables. Pincha una alerta o un problema para ir al dato afectado.</p>

      <h4 class="sec">Alertas del sensor</h4>
      <div class="alert" *ngFor="let a of alertas" [class]="a.nivel"
           [class.clickable]="a.target" (click)="onAlert(a)">
        <div class="alert-top">
          <span class="dot"></span>
          <strong>{{ a.titulo }}</strong>
          <span class="alert-date">{{ a.fecha }}</span>
        </div>
        <p>{{ a.detalle }}</p>
        <span class="alert-cta" *ngIf="a.target">Ver en el gráfico →</span>
      </div>

      <button class="analizar" (click)="analizar()">
        <span class="pulse"></span> {{ analizado() ? 'Re-analizar' : 'Analizar con agente' }}
      </button>

      <div class="analysis" *ngIf="analizado()">
        <h4 class="sec">Problemas priorizados</h4>
        <div class="ao-item" *ngFor="let p of resumen.problemas"
             [class.clickable]="p.scope" (click)="p.scope && verContratos(p.scope)">
          <span class="pill" [ngClass]="p.sev">{{ p.sev }}</span>
          <span>{{ p.texto }}<span class="mini-cta" *ngIf="p.scope"> · ver contratos →</span></span>
        </div>

        <h4 class="sec">Cambios relevantes</h4>
        <div class="ao-line" *ngFor="let c of resumen.cambios"
             [class.clickable]="c.target" (click)="onCambio(c.target)">
          ↳ {{ c.texto }}<span class="mini-cta" *ngIf="c.target"> · ver en gráfico →</span>
        </div>

        <h4 class="sec">Posibles causas</h4>
        <div class="ao-line cause" *ngFor="let c of resumen.causas">💡 {{ c }}</div>
      </div>

      <div class="thresholds">
        <h4 class="sec">Umbrales configurados</h4>
        <div class="th-row" *ngFor="let u of umbrales"><span>{{ u.label }}</span><span>{{ u.valor }}</span></div>
      </div>
    </div>
  </aside>
  <div class="backdrop" [class.show]="store.agentOpen()" (click)="store.closeAgent()"></div>
  `,
  styles: [`
    .sidepanel { position: fixed; top: 0; left: 0; height: 100vh; width: 400px; max-width: 92vw; background: var(--panel); border-right: 1px solid var(--border); z-index: 9; transform: translateX(-105%); transition: transform .26s cubic-bezier(.4,0,.2,1); display: flex; flex-direction: column; }
    .sidepanel.open { transform: translateX(0); }
    .sp-head { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; border-bottom: 1px solid var(--border); }
    .sp-head h3 { font-size: 15px; margin: 0; display: flex; align-items: center; gap: 9px; }
    .x { background: none; border: none; color: var(--muted); font-size: 16px; cursor: pointer; }
    .sp-body { padding: 18px 20px; overflow-y: auto; }
    .sp-intro { font-size: 12.5px; color: var(--muted); margin: 0 0 14px; line-height: 1.5; }
    .sec { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted); margin: 18px 0 10px; }
    .sec:first-of-type { margin-top: 0; }
    .pulse { width: 9px; height: 9px; border-radius: 50%; background: #4ade80; display: inline-block; box-shadow: 0 0 0 0 #4ade8099; animation: pulse 1.8s infinite; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 #4ade8099; } 70% { box-shadow: 0 0 0 8px #4ade8000; } 100% { box-shadow: 0 0 0 0 #4ade8000; } }
    .alert { border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; border: 1px solid var(--border); background: var(--panel-2); }
    .alert.clickable { cursor: pointer; transition: border-color .12s, background .12s; }
    .alert.clickable:hover { background: #1e293b66; border-color: #6366f1aa; }
    .alert-top { display: flex; align-items: center; gap: 8px; font-size: 13.5px; }
    .alert-top .alert-date { margin-left: auto; font-size: 11px; color: var(--muted); }
    .alert p { font-size: 12.5px; color: var(--muted); margin: 6px 0 0; line-height: 1.5; }
    .alert .dot { width: 9px; height: 9px; border-radius: 50%; flex: none; }
    .alert.error { border-color: #ef444455; } .alert.error .dot { background: var(--red); }
    .alert.warning { border-color: #f59e0b55; } .alert.warning .dot { background: var(--amber); }
    .alert.ok .dot { background: var(--teal); }
    .alert-cta { display: inline-block; margin-top: 8px; font-size: 11.5px; font-weight: 600; color: #818cf8; }
    .analizar { width: 100%; margin-top: 16px; display: flex; align-items: center; justify-content: center; gap: 9px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; padding: 11px 16px; border-radius: 10px; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .analysis { animation: fade .3s; }
    @keyframes fade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; } }
    .ao-item { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 9px; font-size: 12.5px; line-height: 1.5; padding: 7px 9px; border-radius: 8px; }
    .ao-item .pill { text-transform: capitalize; flex: none; }
    .ao-item.clickable, .ao-line.clickable { cursor: pointer; }
    .ao-item.clickable:hover, .ao-line.clickable:hover { background: #1e293b66; }
    .ao-line { font-size: 12.5px; color: #cbd5e1; line-height: 1.55; margin-bottom: 8px; padding: 6px 9px; border-radius: 8px; }
    .ao-line.cause { color: #c7d2fe; }
    .mini-cta { color: #818cf8; font-weight: 600; }
    .thresholds { margin-top: 18px; border-top: 1px solid var(--border); padding-top: 6px; }
    .th-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px dashed var(--border); }
    .th-row span:last-child { font-weight: 600; }
    .backdrop { position: fixed; inset: 0; background: #00000077; opacity: 0; pointer-events: none; transition: opacity .2s; z-index: 8; }
    .backdrop.show { opacity: 1; pointer-events: auto; }
  `],
})
export class AgentPanel {
  readonly store = inject(ContextStore);
  readonly alertas = ALERTAS;
  readonly resumen = AGENTE_RESUMEN;
  readonly analizado = signal(false);

  readonly umbrales = [
    { label: 'PD media máx.', valor: '3,00 %' },
    { label: 'PSI revisión', valor: '0,20' },
    { label: 'Δ LGD intermensual', valor: '±10 %' },
    { label: 'Contratos faltantes', valor: '0' },
  ];

  analizar() { this.analizado.set(true); }

  onAlert(a: Alerta) {
    const t = a.target;
    if (!t) return;
    this.store.closeAgent();
    if (t.metric && t.date) this.store.goToChartPoint(t.metric, t.date);
    else if (t.scope) this.store.openContracts(t.scope);
  }

  verContratos(scope: string) {
    this.store.closeAgent();
    this.store.openContracts(scope);
  }

  onCambio(t?: AgenteTarget) {
    if (!t?.metric || !t.date) return;
    this.store.closeAgent();
    this.store.goToChartPoint(t.metric, t.date);
  }
}
