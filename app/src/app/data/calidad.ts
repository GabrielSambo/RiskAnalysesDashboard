/** Sección 4 · Control de calidad + agente — datos hardcodeados */

export interface Check {
  categoria: string;
  nombre: string;
  resultado: 'ok' | 'warning' | 'error';
  detalle: string;
  impacto: string;
  afectados: number;
  scope?: string; // drill-down de contratos afectados (ver data/contratos.ts)
}

export const CHECKS: Check[] = [
  { categoria: 'Completitud', nombre: 'Valores missing', resultado: 'warning', detalle: '38 contratos sin LGD informada en 2025-12.', impacto: 'Sesga LGD media a la baja', afectados: 38, scope: 'lgd-missing' },
  { categoria: 'Unicidad', nombre: 'Duplicados', resultado: 'ok', detalle: '0 expedientes duplicados por (id_contrato, fecha_ref).', impacto: '—', afectados: 0 },
  { categoria: 'Coherencia', nombre: 'Default vs estado', resultado: 'error', detalle: '7 contratos con default = 1 pero estado = "Sano".', impacto: 'Infraestima la tasa de default', afectados: 7, scope: 'incoh-default-estado' },
  { categoria: 'Reglas', nombre: 'Regla DPD > 90 → default', resultado: 'warning', detalle: '14 contratos con DPD > 90 sin marcar como default.', impacto: 'Incumplimiento regulatorio', afectados: 14, scope: 'dpd90-sin-default' },
  { categoria: 'Reglas', nombre: 'PD válida (0–1)', resultado: 'ok', detalle: 'Todas las PD dentro de rango [0, 1].', impacto: '—', afectados: 0 },
  { categoria: 'Consistencia', nombre: 'Comparativa PD vs LGD', resultado: 'warning', detalle: 'Correlación PD–LGD = 0,62 (esperada < 0,40). Posible solapamiento de drivers.', impacto: 'Revisar independencia de modelos', afectados: 0 },
  { categoria: 'Cobertura', nombre: 'Contratos esperados', resultado: 'ok', detalle: '13.070 / 13.070 contratos presentes en el último cierre.', impacto: '—', afectados: 0 },
];

/** Destino al pinchar un elemento del agente. */
export interface AgenteTarget { metric?: 'defaults' | 'pd' | 'lgd'; date?: string; scope?: string; }

/** Resumen que "genera" el agente al pulsar el botón. */
export const AGENTE_RESUMEN = {
  titular: 'He analizado 7 checks sobre 13.070 contratos del cierre 2025-12',
  problemas: [
    { sev: 'error', texto: '7 contratos con default = 1 y estado "Sano" → incoherencia que infraestima la tasa de default.', scope: 'incoh-default-estado' },
    { sev: 'warning', texto: '14 contratos superan DPD > 90 sin marca de default → posible incumplimiento de la regla regulatoria.', scope: 'dpd90-sin-default' },
    { sev: 'warning', texto: 'Correlación PD–LGD de 0,62, por encima de lo esperado → revisar independencia entre modelos.' },
  ] as { sev: string; texto: string; scope?: string }[],
  cambios: [
    { texto: 'La LGD media cayó -17% en 2025-07; coincide con una venta de cartera registrada ese mes.', target: { metric: 'lgd', date: '2025-07' } },
    { texto: 'El nº de contratos en contencioso subió +312 en 2025-03, explicando el pico de defaults.', target: { metric: 'defaults', date: '2025-03' } },
  ] as { texto: string; target?: AgenteTarget }[],
  causas: [
    'Las 7 incoherencias default/estado se concentran en expedientes recién entrados en contencioso: probable desfase de actualización del estado respecto a la marca de default.',
    'Los 38 LGD missing corresponden a contratos en contencioso sin recobro cerrado todavía.',
  ],
};
