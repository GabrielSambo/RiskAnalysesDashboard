/**
 * E2 · Dataset de contratos a nivel expediente (hardcodeado).
 *
 * Es la "capa de dato real" que hay debajo de cada agregado de la herramienta.
 * Hoy la app solo conoce números agregados (312 en contencioso, 7 incoherencias,
 * 38 LGD missing…). Esto da las FILAS detrás de esos números para poder hacer
 * drill-down ("bajar a los contratos que explican el dato").
 *
 * Enfoque: muestra curada por scope (~10-15 filas) consistente con el total real.
 * El UI muestra "mostrando N de TOTAL".  No hay población generada: cada fila está
 * escrita a mano para que cuadre con la narrativa de la demo.
 */

export type Estado = 'Sano' | 'Incumplimiento' | 'Contencioso' | 'Cura' | 'Subjetivo';
export type Segmento = 'Hipotecario' | 'Consumo' | 'Tarjeta' | 'Pyme' | 'Auto';
export type TipoCliente = 'Particular' | 'Autónomo' | 'Pyme' | 'Corporativo';

export interface Contrato {
  id: string;
  fecha_ref: string;
  estado: Estado;
  segmento: Segmento;
  tipo_cliente: TipoCliente;
  dpd: number;            // días de impago (Days Past Due)
  default: 0 | 1;
  pd: number;             // %
  lgd: number | null;     // % (null = no informada)
  ead: number;            // exposición €
  scopes: string[];       // a qué scopes de drill-down pertenece esta fila
}

/** Metadatos de cada scope: etiqueta legible + total real al que pertenece la muestra. */
export interface ScopeMeta {
  key: string;
  label: string;
  descripcion: string;
  total: number;
}

export const SCOPES: Record<string, ScopeMeta> = {
  'contencioso-2025-03': {
    key: 'contencioso-2025-03',
    label: 'Entradas en contencioso · 2025-03',
    descripcion: 'Expedientes que entraron en contencioso en marzo 2025 y reclasificaron a default. Explican el pico de PD.',
    total: 312,
  },
  'venta-cartera-2025-07': {
    key: 'venta-cartera-2025-07',
    label: 'Venta de cartera · 2025-07',
    descripcion: 'Expedientes dudosos incluidos en la venta de cartera de julio 2025 (nominal € 84,2 M, recobro 61%). Explican la bajada de LGD.',
    total: 540,
  },
  'incoh-default-estado': {
    key: 'incoh-default-estado',
    label: 'Incoherencia default vs estado',
    descripcion: 'Contratos con default = 1 pero estado = "Sano". Infraestiman la tasa de default.',
    total: 7,
  },
  'dpd90-sin-default': {
    key: 'dpd90-sin-default',
    label: 'DPD > 90 sin marca de default',
    descripcion: 'Contratos que superan DPD > 90 días sin estar marcados como default. Posible incumplimiento regulatorio.',
    total: 14,
  },
  'lgd-missing': {
    key: 'lgd-missing',
    label: 'LGD no informada',
    descripcion: 'Contratos sin LGD informada en el cierre 2025-12. Sesgan la LGD media.',
    total: 38,
  },
  'pd-baja-impagos': {
    key: 'pd-baja-impagos',
    label: 'PD baja con impagos',
    descripcion: 'PD < 3% con 3+ impagos en los últimos 6 meses. Inconsistencia PD vs comportamiento.',
    total: 23,
  },
  'pd-alta-sin-impagos': {
    key: 'pd-alta-sin-impagos',
    label: 'PD alta sin impagos',
    descripcion: 'PD > 8% sin ningún impago en 12 meses. Inconsistencia PD vs comportamiento.',
    total: 41,
  },
};

// Factory compacto para no repetir nombres de campo en cada fila.
function c(
  id: string, fecha_ref: string, estado: Estado, segmento: Segmento, tipo_cliente: TipoCliente,
  dpd: number, def: 0 | 1, pd: number, lgd: number | null, ead: number, scopes: string[],
): Contrato {
  return { id, fecha_ref, estado, segmento, tipo_cliente, dpd, default: def, pd, lgd, ead, scopes };
}

export const CONTRATOS: Contrato[] = [
  // ---- contencioso-2025-03 (muestra de 312): hipotecario, DPD alto, default=1 ----
  c('EXP-100482', '2025-03', 'Contencioso', 'Hipotecario', 'Particular', 124, 1, 7.8, 48.2, 182400, ['contencioso-2025-03']),
  c('EXP-100517', '2025-03', 'Contencioso', 'Hipotecario', 'Particular', 131, 1, 8.1, 51.0, 210800, ['contencioso-2025-03']),
  c('EXP-100538', '2025-03', 'Contencioso', 'Hipotecario', 'Autónomo', 109, 1, 6.9, 46.5, 154300, ['contencioso-2025-03']),
  c('EXP-100561', '2025-03', 'Contencioso', 'Hipotecario', 'Particular', 142, 1, 9.0, 53.7, 245100, ['contencioso-2025-03']),
  c('EXP-100574', '2025-03', 'Contencioso', 'Pyme', 'Pyme', 118, 1, 7.4, 49.1, 198600, ['contencioso-2025-03']),
  c('EXP-100590', '2025-03', 'Contencioso', 'Hipotecario', 'Particular', 96, 1, 6.2, 44.8, 167900, ['contencioso-2025-03']),
  c('EXP-100613', '2025-03', 'Contencioso', 'Hipotecario', 'Particular', 155, 1, 9.6, 55.2, 263400, ['contencioso-2025-03']),
  c('EXP-100628', '2025-03', 'Contencioso', 'Consumo', 'Particular', 101, 1, 6.7, 47.3, 28900, ['contencioso-2025-03']),
  c('EXP-100644', '2025-03', 'Contencioso', 'Hipotecario', 'Autónomo', 127, 1, 8.3, 50.4, 219700, ['contencioso-2025-03']),
  c('EXP-100659', '2025-03', 'Contencioso', 'Hipotecario', 'Particular', 113, 1, 7.1, 48.9, 191200, ['contencioso-2025-03']),
  c('EXP-100671', '2025-03', 'Contencioso', 'Pyme', 'Corporativo', 134, 1, 8.7, 52.6, 312500, ['contencioso-2025-03']),
  c('EXP-100688', '2025-03', 'Contencioso', 'Hipotecario', 'Particular', 121, 1, 7.6, 49.8, 205300, ['contencioso-2025-03']),

  // ---- venta-cartera-2025-07 (muestra de 540): dudosos vendidos, LGD baja post-venta ----
  c('EXP-200714', '2025-07', 'Incumplimiento', 'Consumo', 'Particular', 168, 1, 11.2, 37.5, 22400, ['venta-cartera-2025-07']),
  c('EXP-200729', '2025-07', 'Contencioso', 'Hipotecario', 'Particular', 201, 1, 12.8, 39.1, 178300, ['venta-cartera-2025-07']),
  c('EXP-200743', '2025-07', 'Incumplimiento', 'Tarjeta', 'Particular', 152, 1, 10.4, 36.2, 8600, ['venta-cartera-2025-07']),
  c('EXP-200758', '2025-07', 'Contencioso', 'Pyme', 'Pyme', 224, 1, 13.5, 40.3, 142700, ['venta-cartera-2025-07']),
  c('EXP-200766', '2025-07', 'Incumplimiento', 'Auto', 'Particular', 147, 1, 9.9, 38.0, 16900, ['venta-cartera-2025-07']),
  c('EXP-200781', '2025-07', 'Contencioso', 'Hipotecario', 'Autónomo', 213, 1, 13.0, 39.6, 196400, ['venta-cartera-2025-07']),
  c('EXP-200795', '2025-07', 'Incumplimiento', 'Consumo', 'Particular', 159, 1, 10.7, 37.1, 24800, ['venta-cartera-2025-07']),
  c('EXP-200807', '2025-07', 'Incumplimiento', 'Tarjeta', 'Autónomo', 141, 1, 9.6, 36.8, 11200, ['venta-cartera-2025-07']),
  c('EXP-200819', '2025-07', 'Contencioso', 'Hipotecario', 'Particular', 236, 1, 14.1, 40.9, 221500, ['venta-cartera-2025-07']),
  c('EXP-200834', '2025-07', 'Incumplimiento', 'Pyme', 'Corporativo', 173, 1, 11.6, 38.4, 98300, ['venta-cartera-2025-07']),
  c('EXP-200848', '2025-07', 'Incumplimiento', 'Consumo', 'Particular', 138, 1, 9.3, 37.8, 19700, ['venta-cartera-2025-07']),
  c('EXP-200861', '2025-07', 'Contencioso', 'Auto', 'Particular', 192, 1, 12.4, 39.3, 27600, ['venta-cartera-2025-07']),

  // ---- incoh-default-estado (total 7, mostramos los 7): default=1 pero estado=Sano ----
  c('EXP-300011', '2025-12', 'Sano', 'Hipotecario', 'Particular', 97, 1, 6.4, 47.0, 173200, ['incoh-default-estado']),
  c('EXP-300024', '2025-12', 'Sano', 'Consumo', 'Particular', 104, 1, 6.8, 45.9, 21300, ['incoh-default-estado']),
  c('EXP-300037', '2025-12', 'Sano', 'Hipotecario', 'Autónomo', 112, 1, 7.0, 48.6, 188700, ['incoh-default-estado']),
  c('EXP-300048', '2025-12', 'Sano', 'Pyme', 'Pyme', 99, 1, 6.5, 46.3, 134500, ['incoh-default-estado']),
  c('EXP-300055', '2025-12', 'Sano', 'Tarjeta', 'Particular', 108, 1, 6.9, 44.1, 7800, ['incoh-default-estado']),
  c('EXP-300062', '2025-12', 'Sano', 'Hipotecario', 'Particular', 119, 1, 7.3, 49.2, 201600, ['incoh-default-estado']),
  c('EXP-300079', '2025-12', 'Sano', 'Auto', 'Particular', 93, 1, 6.1, 45.5, 18400, ['incoh-default-estado']),

  // ---- dpd90-sin-default (total 14, muestra de 10): DPD>90 y default=0 ----
  c('EXP-400103', '2025-12', 'Incumplimiento', 'Hipotecario', 'Particular', 96, 0, 5.8, 46.0, 169800, ['dpd90-sin-default']),
  c('EXP-400118', '2025-12', 'Incumplimiento', 'Consumo', 'Particular', 102, 0, 6.0, 44.7, 23100, ['dpd90-sin-default']),
  c('EXP-400126', '2025-12', 'Incumplimiento', 'Pyme', 'Pyme', 114, 0, 6.6, 47.8, 141200, ['dpd90-sin-default']),
  c('EXP-400139', '2025-12', 'Incumplimiento', 'Hipotecario', 'Autónomo', 91, 0, 5.6, 45.3, 177400, ['dpd90-sin-default']),
  c('EXP-400147', '2025-12', 'Incumplimiento', 'Tarjeta', 'Particular', 123, 0, 6.9, 43.5, 9400, ['dpd90-sin-default']),
  c('EXP-400158', '2025-12', 'Incumplimiento', 'Auto', 'Particular', 98, 0, 5.9, 46.6, 19100, ['dpd90-sin-default']),
  c('EXP-400164', '2025-12', 'Incumplimiento', 'Hipotecario', 'Particular', 131, 0, 7.2, 48.1, 213500, ['dpd90-sin-default']),
  c('EXP-400172', '2025-12', 'Incumplimiento', 'Consumo', 'Autónomo', 105, 0, 6.1, 44.0, 26700, ['dpd90-sin-default']),
  c('EXP-400189', '2025-12', 'Incumplimiento', 'Pyme', 'Corporativo', 117, 0, 6.7, 47.2, 156300, ['dpd90-sin-default']),
  c('EXP-400195', '2025-12', 'Incumplimiento', 'Hipotecario', 'Particular', 94, 0, 5.7, 45.8, 184900, ['dpd90-sin-default']),

  // ---- lgd-missing (total 38, muestra de 10): lgd = null ----
  c('EXP-500202', '2025-12', 'Contencioso', 'Hipotecario', 'Particular', 156, 1, 8.9, null, 192300, ['lgd-missing']),
  c('EXP-500217', '2025-12', 'Contencioso', 'Pyme', 'Pyme', 178, 1, 9.7, null, 138600, ['lgd-missing']),
  c('EXP-500229', '2025-12', 'Contencioso', 'Hipotecario', 'Autónomo', 143, 1, 8.4, null, 207800, ['lgd-missing']),
  c('EXP-500234', '2025-12', 'Contencioso', 'Consumo', 'Particular', 134, 1, 8.0, null, 24500, ['lgd-missing']),
  c('EXP-500248', '2025-12', 'Contencioso', 'Hipotecario', 'Particular', 167, 1, 9.2, null, 218400, ['lgd-missing']),
  c('EXP-500256', '2025-12', 'Contencioso', 'Auto', 'Particular', 129, 1, 7.9, null, 21300, ['lgd-missing']),
  c('EXP-500263', '2025-12', 'Contencioso', 'Pyme', 'Corporativo', 189, 1, 10.1, null, 164700, ['lgd-missing']),
  c('EXP-500271', '2025-12', 'Contencioso', 'Hipotecario', 'Particular', 151, 1, 8.7, null, 199100, ['lgd-missing']),
  c('EXP-500288', '2025-12', 'Contencioso', 'Tarjeta', 'Autónomo', 138, 1, 8.2, null, 10600, ['lgd-missing']),
  c('EXP-500294', '2025-12', 'Contencioso', 'Hipotecario', 'Particular', 172, 1, 9.4, null, 226900, ['lgd-missing']),

  // ---- pd-baja-impagos (total 23, muestra de 10): PD<3% con impagos ----
  c('EXP-600305', '2025-12', 'Incumplimiento', 'Consumo', 'Particular', 64, 0, 2.4, 44.2, 27800, ['pd-baja-impagos']),
  c('EXP-600318', '2025-12', 'Incumplimiento', 'Tarjeta', 'Particular', 58, 0, 2.1, 43.0, 8900, ['pd-baja-impagos']),
  c('EXP-600327', '2025-12', 'Incumplimiento', 'Auto', 'Autónomo', 72, 0, 2.7, 45.1, 18200, ['pd-baja-impagos']),
  c('EXP-600334', '2025-12', 'Incumplimiento', 'Consumo', 'Particular', 61, 0, 2.3, 44.6, 25100, ['pd-baja-impagos']),
  c('EXP-600349', '2025-12', 'Incumplimiento', 'Pyme', 'Pyme', 79, 0, 2.9, 46.3, 132400, ['pd-baja-impagos']),
  c('EXP-600351', '2025-12', 'Incumplimiento', 'Tarjeta', 'Particular', 55, 0, 2.0, 42.7, 7600, ['pd-baja-impagos']),
  c('EXP-600368', '2025-12', 'Incumplimiento', 'Consumo', 'Autónomo', 68, 0, 2.6, 44.9, 29300, ['pd-baja-impagos']),
  c('EXP-600375', '2025-12', 'Incumplimiento', 'Auto', 'Particular', 63, 0, 2.4, 45.4, 17500, ['pd-baja-impagos']),
  c('EXP-600382', '2025-12', 'Incumplimiento', 'Consumo', 'Particular', 74, 0, 2.8, 43.8, 26200, ['pd-baja-impagos']),
  c('EXP-600397', '2025-12', 'Incumplimiento', 'Tarjeta', 'Autónomo', 59, 0, 2.2, 42.9, 9100, ['pd-baja-impagos']),

  // ---- pd-alta-sin-impagos (total 41, muestra de 10): PD>8% sin impagos ----
  c('EXP-700408', '2025-12', 'Sano', 'Hipotecario', 'Particular', 0, 0, 8.6, 49.0, 174600, ['pd-alta-sin-impagos']),
  c('EXP-700413', '2025-12', 'Sano', 'Pyme', 'Pyme', 0, 0, 9.2, 50.7, 128900, ['pd-alta-sin-impagos']),
  c('EXP-700426', '2025-12', 'Sano', 'Consumo', 'Particular', 0, 0, 8.4, 47.5, 23700, ['pd-alta-sin-impagos']),
  c('EXP-700438', '2025-12', 'Sano', 'Hipotecario', 'Autónomo', 0, 0, 9.8, 51.4, 203100, ['pd-alta-sin-impagos']),
  c('EXP-700445', '2025-12', 'Sano', 'Auto', 'Particular', 0, 0, 8.3, 46.8, 19400, ['pd-alta-sin-impagos']),
  c('EXP-700457', '2025-12', 'Sano', 'Pyme', 'Corporativo', 0, 0, 10.3, 52.9, 167200, ['pd-alta-sin-impagos']),
  c('EXP-700469', '2025-12', 'Sano', 'Hipotecario', 'Particular', 0, 0, 8.7, 49.6, 188300, ['pd-alta-sin-impagos']),
  c('EXP-700472', '2025-12', 'Sano', 'Tarjeta', 'Particular', 0, 0, 8.5, 45.2, 8200, ['pd-alta-sin-impagos']),
  c('EXP-700486', '2025-12', 'Sano', 'Consumo', 'Autónomo', 0, 0, 9.1, 48.3, 26900, ['pd-alta-sin-impagos']),
  c('EXP-700493', '2025-12', 'Sano', 'Hipotecario', 'Particular', 0, 0, 9.5, 50.1, 215700, ['pd-alta-sin-impagos']),
];

/** Devuelve la muestra de contratos de un scope + su total real. */
export function contractsFor(scope: string): { rows: Contrato[]; total: number; meta: ScopeMeta | null } {
  const meta = SCOPES[scope] ?? null;
  const rows = CONTRATOS.filter(ct => ct.scopes.includes(scope));
  return { rows, total: meta?.total ?? rows.length, meta };
}
