/** Sección 3 · Trazabilidad (data lineage) — grafo hardcodeado */

export interface NodoLinaje {
  id: string;
  nombre: string;
  capa: 'origen' | 'transformacion' | 'modelo' | 'dashboard';
  x: number;
  y: number;
  detalle: string;
  dependencias: string[];
  impacto: string;
  // acción de salida: salta al dato/gráfico que alimenta este nodo
  link?: { metric?: 'defaults' | 'pd' | 'lgd'; date?: string; scope?: string; dashboard?: boolean; label: string };
}

export const CAPAS = [
  { clave: 'origen', titulo: 'Origen', color: '#38bdf8' },
  { clave: 'transformacion', titulo: 'Transformación', color: '#a78bfa' },
  { clave: 'modelo', titulo: 'Modelo', color: '#f59e0b' },
  { clave: 'dashboard', titulo: 'Dashboard', color: '#2dd4bf' },
] as const;

export const NODOS: NodoLinaje[] = [
  { id: 'core', nombre: 'core_banking.expedientes', capa: 'origen', x: 80, y: 60, detalle: 'BBDD transaccional con el detalle de cada expediente y su histórico de DPD.', dependencias: [], impacto: 'Fuente primaria — afecta a todo el flujo aguas abajo.' },
  { id: 'cont', nombre: 'movimientos_contencioso.csv', capa: 'origen', x: 80, y: 220, detalle: 'Fichero con entradas/salidas de contencioso y fechas judiciales.', dependencias: [], impacto: 'Determina el estado "Contencioso" y picos de default.', link: { scope: 'contencioso-2025-03', label: 'Ver contratos afectados' } },
  { id: 'etl', nombre: 'ETL · normalización + DPD', capa: 'transformacion', x: 340, y: 80, detalle: 'Limpieza, normalización de fechas y cálculo de DPD por expediente y mes.', dependencias: ['core', 'cont'], impacto: 'Un cambio aquí afecta a estado, default, PD y LGD.' },
  { id: 'rules', nombre: 'Reglas de negocio (default)', capa: 'transformacion', x: 340, y: 240, detalle: 'Aplica reglas regulatorias: DPD > 90 → default; derivación de estados.', dependencias: ['etl'], impacto: 'Define la variable default a nivel contrato.', link: { metric: 'defaults', date: '2025-03', label: 'Ver en el dashboard' } },
  { id: 'mpd', nombre: 'Modelo PD', capa: 'modelo', x: 600, y: 70, detalle: 'Scoring de comportamiento calibrado a frecuencia de default observada.', dependencias: ['etl', 'rules'], impacto: 'Alimenta KPIs de PD y la monitorización del modelo.', link: { metric: 'pd', date: '2025-03', label: 'Ver en el dashboard' } },
  { id: 'mlgd', nombre: 'Modelo LGD', capa: 'modelo', x: 600, y: 220, detalle: 'Estima severidad a partir de recobros históricos descontados.', dependencias: ['etl'], impacto: 'Alimenta KPIs de LGD y comparativas PD vs LGD.', link: { metric: 'lgd', date: '2025-07', label: 'Ver en el dashboard' } },
  { id: 'dash', nombre: 'Dashboard de control', capa: 'dashboard', x: 860, y: 150, detalle: 'Visualización final: KPIs, series temporales, segmentación y anomalías.', dependencias: ['mpd', 'mlgd', 'rules'], impacto: 'Capa de consumo de negocio.', link: { dashboard: true, label: 'Ir al dashboard' } },
];

export const ARISTAS: [string, string][] = [
  ['core', 'etl'], ['cont', 'etl'], ['etl', 'rules'],
  ['etl', 'mpd'], ['rules', 'mpd'], ['etl', 'mlgd'],
  ['mpd', 'dash'], ['mlgd', 'dash'], ['rules', 'dash'],
];
