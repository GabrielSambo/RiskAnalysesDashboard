/**
 * E1 · Store de contexto compartido + E3 · intents de navegación cruzada.
 *
 * Servicio singleton (signals) que mantiene el FOCO actual: el pequeño conjunto de
 * cosas que a varias secciones les importa (métrica activa, fecha, ventana temporal,
 * variable, nodo de linaje, anomalía abierta, scope de drill-down de contratos).
 *
 * Es la espina dorsal de "pincha aquí y se ilumina allá". Hasta ahora cada componente
 * guardaba su estado en privado (p. ej. el dashboard tenía selectedMetric / window /
 * explicacion como signals locales), por eso nada conectaba entre secciones.
 */
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ANOMALIAS, Anomalia } from '../data/mock-data';

export type MetricKey = 'defaults' | 'pd' | 'lgd';
export type Ventana = 6 | 12 | 24;

export interface Focus {
  metric: MetricKey | null;
  date: string | null;
  window: Ventana;
  variable: string | null;
  nodeId: string | null;
  anomalyKey: string | null;   // `${serie}@${fecha}`
  scope: string | null;        // scope de drill-down de contratos (ver data/contratos.ts)
}

/** Clave estable de una anomalía. */
export function anomalyKey(a: Anomalia): string {
  return `${a.serie}@${a.fecha}`;
}

const FOCO_INICIAL: Focus = {
  metric: 'defaults', date: null, window: 24,
  variable: null, nodeId: null, anomalyKey: null, scope: null,
};

@Injectable({ providedIn: 'root' })
export class ContextStore {
  private readonly router = inject(Router);

  readonly focus = signal<Focus>({ ...FOCO_INICIAL });

  /** Panel del agente (compartido entre dashboard y calidad). */
  readonly agentOpen = signal(false);
  openAgent() { this.agentOpen.set(true); }
  closeAgent() { this.agentOpen.set(false); }
  toggleAgent() { this.agentOpen.update(v => !v); }

  /** Anomalía actualmente enfocada (derivada de anomalyKey). */
  readonly activeAnomaly = computed<Anomalia | null>(() => {
    const k = this.focus().anomalyKey;
    return k ? (ANOMALIAS.find(a => anomalyKey(a) === k) ?? null) : null;
  });

  // ---- setters granulares ----
  setMetric(metric: MetricKey) { this.focus.update(f => ({ ...f, metric })); }
  setWindow(window: Ventana) { this.focus.update(f => ({ ...f, window })); }
  focusVariable(variable: string | null) { this.focus.update(f => ({ ...f, variable })); }
  focusNode(nodeId: string | null) { this.focus.update(f => ({ ...f, nodeId })); }
  openContracts(scope: string | null) { this.focus.update(f => ({ ...f, scope })); }

  /** Enfoca una anomalía (alinea métrica y fecha con ella). null = cerrar. */
  focusAnomaly(a: Anomalia | null) {
    this.focus.update(f => a
      ? { ...f, anomalyKey: anomalyKey(a), metric: a.serie, date: a.fecha }
      : { ...f, anomalyKey: null });
  }

  clear() { this.focus.set({ ...FOCO_INICIAL }); }

  // ---- intents de navegación cruzada (E3) ----
  /** Ir al gráfico principal en (métrica, fecha); abre la anomalía si existe en ese punto. */
  goToChartPoint(metric: MetricKey, date: string) {
    const anom = ANOMALIAS.find(a => a.serie === metric && a.fecha === date) ?? null;
    this.focus.update(f => ({ ...f, metric, date, anomalyKey: anom ? anomalyKey(anom) : null }));
    this.router.navigate(['/dashboard']);
  }

  goToLineageNode(nodeId: string) {
    this.focusNode(nodeId);
    this.router.navigate(['/trazabilidad']);
  }

  goToVariable(variable: string) {
    this.focusVariable(variable);
    this.router.navigate(['/conocimiento']);
  }
}
