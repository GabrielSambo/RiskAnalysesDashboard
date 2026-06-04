/** Sección 6 · Monitorización del modelo y consistencia del riesgo — hardcodeado */

export interface Inconsistencia {
  tipo: string;
  descripcion: string;
  casos: number;
  severidad: 'alta' | 'media' | 'baja';
  scope?: string; // drill-down de contratos afectados (ver data/contratos.ts)
}

export const INCONSISTENCIAS: Inconsistencia[] = [
  { tipo: 'Estado vs default', descripcion: 'default = 1 pero estado = "Sano"', casos: 7, severidad: 'alta', scope: 'incoh-default-estado' },
  { tipo: 'Estado vs default', descripcion: 'DPD > 90 sin estado "Incumplimiento"', casos: 14, severidad: 'media', scope: 'dpd90-sin-default' },
  { tipo: 'PD vs comportamiento', descripcion: 'PD baja (<3%) con 3+ impagos en 6 meses', casos: 23, severidad: 'media', scope: 'pd-baja-impagos' },
  { tipo: 'PD vs comportamiento', descripcion: 'PD alta (>8%) sin ningún impago en 12 meses', casos: 41, severidad: 'baja', scope: 'pd-alta-sin-impagos' },
];

/** Destino al pinchar un driver / métrica del resumen. */
export interface MonitorTarget { metric?: 'defaults' | 'pd' | 'lgd'; date?: string; scope?: string; }

/** Resumen automático del periodo en lenguaje de negocio + drivers accionables. */
export const RESUMEN_PERIODO = {
  texto:
    'Entre 2024 H2 y 2025 H2 el riesgo de la cartera subió. La PD media pasó de 2,29% a ' +
    '2,62% (+0,33 pp), empujada por las entradas en contencioso del primer trimestre de ' +
    '2025. La LGD bajó de 45,9% a 39,9% por la venta de cartera de julio (efecto puntual ' +
    'de gestión, no un cambio estructural). El peso del contencioso en la cartera creció ' +
    'del 4,6% al 6,7%.',
  drivers: [
    { texto: 'Entradas en contencioso (Q1 2025) → +312 expedientes, principal driver de la subida de PD/defaults', target: { scope: 'contencioso-2025-03' } as MonitorTarget },
    { texto: 'Venta de cartera (jul 2025) → bajada puntual de LGD (-7,9 pp)', target: { metric: 'lgd', date: '2025-07' } as MonitorTarget },
    { texto: 'Desplazamiento del score de comportamiento hacia tramos de mayor riesgo', target: undefined as MonitorTarget | undefined },
  ],
};

/** Interpretación de negocio del data drift (PSI como detalle secundario). */
export const DRIFT_INTERPRETACION = {
  texto:
    'La distribución del score de comportamiento se ha desplazado hacia tramos de menor ' +
    'score (mayor riesgo): la masa por debajo de 400 puntos pasó del 15% al 27% de la ' +
    'cartera, mientras los tramos altos (600-1000) se reducen. Es el cambio que más afecta ' +
    'a la calibración de la PD.',
  psi: 0.27,
  nivel: 'alto' as const,
};

/** Comparativa de dos ventanas temporales para evaluar estabilidad. */
export const COMPARATIVA_VENTANAS = {
  ventanaA: { etiqueta: '2024 H2', pd: 2.29, lgd: 45.9, defaults: 285, contratos: 12410 },
  ventanaB: { etiqueta: '2025 H2', pd: 2.62, lgd: 39.9, defaults: 339, contratos: 12930 },
};

/** Composición de la cartera por estado en dos momentos (drift de composición, %). */
export const COMPOSICION = {
  estados: ['Sano', 'Incumplimiento', 'Contencioso', 'Cura', 'Subjetivo'],
  ventanaA: [82.5, 9.1, 4.6, 2.6, 1.2], // 2024 H2
  ventanaB: [77.9, 10.3, 6.7, 3.6, 1.5], // 2025 H2
};

/** PSI por variable (drift de distribuciones). */
export const PSI_VARIABLES: { variable: string; psi: number }[] = [
  { variable: 'Score comportamiento', psi: 0.27 },
  { variable: 'DPD', psi: 0.18 },
  { variable: 'Exposición (EAD)', psi: 0.09 },
  { variable: 'Antigüedad', psi: 0.05 },
  { variable: 'PD', psi: 0.21 },
];
