/**
 * Datos totalmente hardcodeados para la demo del "Modelo de Control de Datos".
 * No hay backend: todo lo que se muestra vive en este fichero.
 *
 * Dominio: cartera de riesgo de crédito. Métricas por fecha de referencia (mensual).
 * Hay dos "historias" plantadas a propósito para la explicabilidad (click-to-explain):
 *   - Pico de defaults en 2025-03  -> aumento de contencioso.
 *   - Bajada de LGD en 2025-07     -> venta de cartera / recobro.
 */

export interface SerieTemporal {
  fechas: string[];
  contratos: number[];
  defaults: number[];
  pd: number[];   // PD media (%)
  lgd: number[];  // LGD media (%)
}

// 24 meses de fecha de referencia
export const FECHAS: string[] = [
  '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
  '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
  '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
  '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
];

export const SERIE: SerieTemporal = {
  fechas: FECHAS,
  contratos: [
    11820, 11890, 11975, 12040, 12110, 12180,
    12230, 12290, 12350, 12410, 12460, 12520,
    12580, 12640, 12700, 12690, 12720, 12760,
    12810, 12850, 12900, 12950, 13010, 13070,
  ],
  defaults: [
    248, 252, 259, 261, 266, 270,
    274, 279, 283, 288, 291, 296,
    305, 318, 472, 405, 372, 360, // <- pico en 2025-03 (contencioso)
    351, 344, 339, 336, 332, 330,
  ],
  pd: [
    2.10, 2.12, 2.16, 2.17, 2.20, 2.22,
    2.24, 2.27, 2.29, 2.32, 2.33, 2.36,
    2.42, 2.51, 3.72, 3.19, 2.92, 2.82, // <- pico PD acompaña al de defaults
    2.74, 2.68, 2.63, 2.59, 2.55, 2.52,
  ],
  lgd: [
    45.2, 45.1, 45.4, 45.3, 45.6, 45.5,
    45.8, 45.7, 46.0, 46.1, 46.0, 46.3,
    46.4, 46.6, 46.9, 47.0, 46.8, 46.7,
    38.9, 39.4, 39.8, 40.1, 40.3, 40.6, // <- bajada brusca en 2025-07 (venta cartera)
  ],
};

// ---- KPIs (último mes de referencia: 2025-12) ----
export interface Kpi {
  clave: string;
  titulo: string;
  valor: string;
  variacion: number; // % vs mes anterior
  sufijo?: string;
}

export const KPIS: Kpi[] = [
  { clave: 'contratos', titulo: 'Nº contratos', valor: '13.070', variacion: 0.46 },
  { clave: 'defaults', titulo: 'Nº defaults', valor: '330', variacion: -0.60 },
  { clave: 'pd', titulo: 'PD media', valor: '2,52', sufijo: '%', variacion: -1.17 },
  { clave: 'lgd', titulo: 'LGD media', valor: '40,6', sufijo: '%', variacion: 0.74 },
];

// ---- Segmentación por estado (último mes) ----
export interface SegmentoEstado {
  estado: string;
  contratos: number;
  color: string;
}

export const POR_ESTADO: SegmentoEstado[] = [
  { estado: 'Sano', contratos: 10180, color: '#2dd4bf' },
  { estado: 'Incumplimiento', contratos: 1340, color: '#f59e0b' },
  { estado: 'Contencioso', contratos: 870, color: '#ef4444' },
  { estado: 'Cura', contratos: 470, color: '#60a5fa' },
  { estado: 'Subjetivo', contratos: 210, color: '#a78bfa' },
];

// ---- Segmentación por drivers ----
export interface Driver {
  categoria: string;
  buckets: { etiqueta: string; valor: number }[];
}

export const DRIVERS: Driver[] = [
  {
    categoria: 'Tiempo en mora',
    buckets: [
      { etiqueta: '0-30 d', valor: 520 },
      { etiqueta: '31-60 d', valor: 410 },
      { etiqueta: '61-90 d', valor: 290 },
      { etiqueta: '91-180 d', valor: 180 },
      { etiqueta: '>180 d', valor: 120 },
    ],
  },
  {
    categoria: 'Antigüedad del expediente',
    buckets: [
      { etiqueta: '<1 año', valor: 3200 },
      { etiqueta: '1-3 años', valor: 5400 },
      { etiqueta: '3-5 años', valor: 2900 },
      { etiqueta: '>5 años', valor: 1570 },
    ],
  },
  {
    categoria: 'Tipo de cliente',
    buckets: [
      { etiqueta: 'Particular', valor: 7800 },
      { etiqueta: 'Autónomo', valor: 2600 },
      { etiqueta: 'Pyme', valor: 1900 },
      { etiqueta: 'Corporativo', valor: 770 },
    ],
  },
];

// ---- ODFs / tasas de mora bajo distintas definiciones ----
// "tasas de mora respecto a una por el tiempo" (transcripción): dos líneas, una sobre otra.
export interface OdfSerie {
  nombre: string;
  descripcion: string;
  valores: number[];
}

export const ODFS: OdfSerie[] = [
  {
    nombre: 'ODF 90+ (DPD > 90)',
    descripcion: 'Tasa de mora bajo definición regulatoria de default (DPD > 90 días).',
    valores: [
      1.82, 1.85, 1.88, 1.90, 1.93, 1.95, 1.98, 2.01, 2.04, 2.07, 2.09, 2.12,
      2.18, 2.26, 3.05, 2.71, 2.52, 2.44, 2.38, 2.33, 2.29, 2.26, 2.23, 2.20,
    ],
  },
  {
    nombre: 'ODF 30+ (DPD > 30)',
    descripcion: 'Tasa de mora temprana (DPD > 30 días). Señal adelantada del comportamiento.',
    valores: [
      3.41, 3.46, 3.50, 3.54, 3.58, 3.61, 3.65, 3.70, 3.74, 3.78, 3.81, 3.86,
      3.95, 4.10, 5.20, 4.66, 4.34, 4.20, 4.10, 4.02, 3.95, 3.90, 3.85, 3.80,
    ],
  },
];

// ---- Data drift: comparación de distribuciones entre dos ventanas ----
export interface DriftBin {
  bucket: string;
  ventanaA: number; // 2024 H1 (%)
  ventanaB: number; // 2025 H2 (%)
}

export const DATA_DRIFT = {
  variable: 'Score de comportamiento',
  ventanaA: '2024 H1',
  ventanaB: '2025 H2',
  psi: 0.27, // Population Stability Index -> drift moderado/alto
  bins: [
    { bucket: '0-200', ventanaA: 4, ventanaB: 9 },
    { bucket: '200-400', ventanaA: 11, ventanaB: 18 },
    { bucket: '400-600', ventanaA: 26, ventanaB: 31 },
    { bucket: '600-800', ventanaA: 38, ventanaB: 28 },
    { bucket: '800-1000', ventanaA: 21, ventanaB: 14 },
  ] as DriftBin[],
};

// ---- Anomalías detectadas + explicación automática (IA) ----
export interface Anomalia {
  serie: 'defaults' | 'pd' | 'lgd';
  fecha: string;
  tipo: 'pico' | 'caida' | 'cambio_tendencia';
  titulo: string;
  explicacion: string;
  drivers: { etiqueta: string; valor: string }[];
  scope?: string;  // scope de drill-down de contratos (ver data/contratos.ts)
  nodeId?: string; // nodo de linaje donde "ver cómo se construye" (ver data/lineage.ts)
}

export const ANOMALIAS: Anomalia[] = [
  {
    serie: 'defaults',
    fecha: '2025-03',
    tipo: 'pico',
    scope: 'contencioso-2025-03',
    nodeId: 'cont',
    titulo: 'Pico de defaults (+48% intermensual)',
    explicacion:
      'El repunte de defaults en marzo 2025 se explica principalmente por un aumento de ' +
      'contratos que pasan a estado de contencioso (+312 expedientes). La entrada en ' +
      'contencioso de un bloque de la cartera hipotecaria reclasificó como default ' +
      'operaciones que ya superaban DPD > 90. No se observa deterioro generalizado: el ' +
      'resto de segmentos se mantiene estable.',
    drivers: [
      { etiqueta: 'Δ Contencioso', valor: '+312 exp.' },
      { etiqueta: 'Segmento', valor: 'Hipotecario' },
      { etiqueta: 'DPD medio', valor: '118 días' },
      { etiqueta: 'Impacto PD', valor: '+1,21 pp' },
    ],
  },
  {
    serie: 'lgd',
    fecha: '2025-07',
    tipo: 'caida',
    scope: 'venta-cartera-2025-07',
    nodeId: 'mlgd',
    titulo: 'Bajada de LGD (-17% intermensual)',
    explicacion:
      'La caída de la LGD media en julio 2025 responde a una venta de cartera de dudosos ' +
      'cerrada ese mes. La operación materializó recobros por encima del valor en libros, ' +
      'reduciendo la severidad observada. Es un efecto puntual de gestión, no un cambio ' +
      'estructural en la capacidad de recuperación.',
    drivers: [
      { etiqueta: 'Evento', valor: 'Venta de cartera' },
      { etiqueta: 'Nominal vendido', valor: '€ 84,2 M' },
      { etiqueta: 'Tasa recobro', valor: '61%' },
      { etiqueta: 'Impacto LGD', valor: '-7,9 pp' },
    ],
  },
  {
    serie: 'pd',
    fecha: '2025-03',
    tipo: 'pico',
    scope: 'contencioso-2025-03',
    nodeId: 'cont',
    titulo: 'Pico de PD media (+1,21 pp intermensual)',
    explicacion:
      'La PD media saltó a 3,72% en marzo 2025 (desde 2,51%) arrastrada por el mismo ' +
      'bloque de expedientes que entró en contencioso. Al reclasificarse como default ' +
      'operaciones de mayor severidad, la frecuencia de default observada subió y, con ' +
      'ella, la PD calibrada. Es un efecto concentrado en cartera hipotecaria, no un ' +
      'deterioro generalizado del scoring.',
    drivers: [
      { etiqueta: 'PD anterior', valor: '2,51%' },
      { etiqueta: 'PD pico', valor: '3,72%' },
      { etiqueta: 'Segmento', valor: 'Hipotecario' },
      { etiqueta: 'Origen', valor: 'Contencioso' },
    ],
  },
];

// ---- Tabla pivot dinámica (defaults por estado y trimestre) ----
export const PIVOT = {
  columnas: ['2025 Q1', '2025 Q2', '2025 Q3', '2025 Q4'],
  filas: [
    { estado: 'Sano', valores: [0, 0, 0, 0] },
    { estado: 'Incumplimiento', valores: [612, 588, 561, 549] },
    { estado: 'Contencioso', valores: [724, 690, 668, 651] },
    { estado: 'Cura', valores: [-180, -165, -158, -152] },
    { estado: 'Subjetivo', valores: [134, 128, 124, 121] },
  ],
};

// ---- Alertas del agente / sensor de calidad ----
export interface Alerta {
  nivel: 'ok' | 'warning' | 'error';
  titulo: string;
  detalle: string;
  fecha: string;
  // destino al pinchar: salta al gráfico (metric+date) y/o abre contratos (scope)
  target?: { metric?: 'defaults' | 'pd' | 'lgd'; date?: string; scope?: string };
}

export const ALERTAS: Alerta[] = [
  {
    nivel: 'error',
    titulo: 'Subida de PD por encima del umbral',
    detalle: 'PD media 3,72% en 2025-03 supera el umbral configurado (3,00%).',
    fecha: '2025-03',
    target: { metric: 'pd', date: '2025-03' },
  },
  {
    nivel: 'warning',
    titulo: 'Data drift moderado en Score de comportamiento',
    detalle: 'PSI = 0,27 entre 2024 H1 y 2025 H2 (umbral de revisión: 0,20).',
    fecha: '2025-12',
  },
  {
    nivel: 'warning',
    titulo: 'Caída anómala de LGD',
    detalle: 'LGD -17% intermensual en 2025-07. Posible evento puntual (venta de cartera).',
    fecha: '2025-07',
    target: { metric: 'lgd', date: '2025-07' },
  },
  {
    nivel: 'ok',
    titulo: 'Sin incoherencias default vs estado',
    detalle: '0 contratos con default = 1 y estado = sano en el último cierre.',
    fecha: '2025-12',
  },
];
