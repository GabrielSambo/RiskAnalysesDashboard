/** Sección 2 · Conocimiento del dato (chatbot + explorador de variables) */

export interface MensajeChat {
  rol: 'usuario' | 'bot';
  texto: string;
  meta?: { etiqueta: string; valor: string }[];
}

/** Preguntas sugeridas (chips). Cada una mapea a una respuesta hardcodeada. */
export interface QA {
  pregunta: string;
  respuesta: MensajeChat;
}

export const PREGUNTAS_SUGERIDAS: QA[] = [
  {
    pregunta: '¿De dónde viene la PD?',
    respuesta: {
      rol: 'bot',
      texto:
        'La PD (Probability of Default) se calcula en el modelo de scoring de comportamiento. ' +
        'Origen: tabla core_banking.expedientes + histórico de DPD. Se transforma agregando ' +
        'el comportamiento de pago de los últimos 12 meses y se calibra a frecuencia de default ' +
        'observada. Se usa en el dashboard principal y en la monitorización del modelo. Es ' +
        'sensible a entradas en contencioso (de ahí el pico de marzo 2025).',
      meta: [
        { etiqueta: 'Origen', valor: 'core_banking.expedientes' },
        { etiqueta: 'Transformación', valor: 'scoring comportamiento 12m' },
        { etiqueta: 'Dependencias', valor: 'ETL · Reglas default' },
        { etiqueta: 'Uso', valor: 'Dashboard · Monitorización' },
      ],
    },
  },
  {
    pregunta: '¿Qué significa la variable "estado"?',
    respuesta: {
      rol: 'bot',
      texto:
        'El "estado" clasifica cada expediente según su situación de riesgo: Sano, Incumplimiento, ' +
        'Contencioso, Cura y Subjetivo. Se deriva de reglas sobre DPD, indicadores judiciales y ' +
        'criterio experto. Es la variable principal para la segmentación de la cartera y cambia ' +
        'cuando varía el DPD o hay movimientos judiciales (entradas/salidas de contencioso).',
      meta: [
        { etiqueta: 'Tipo', valor: 'Categórica (5 niveles)' },
        { etiqueta: 'Origen', valor: 'Reglas DPD + judicial' },
        { etiqueta: 'Dependencias', valor: 'DPD · Indicadores judiciales' },
        { etiqueta: 'Regla clave', valor: 'DPD > 90 → Incumplimiento' },
      ],
    },
  },
  {
    pregunta: '¿Cómo se calcula la LGD?',
    respuesta: {
      rol: 'bot',
      texto:
        'La LGD (Loss Given Default) mide la severidad de la pérdida en caso de default. ' +
        'Se obtiene de los recobros históricos descontados sobre la exposición en el momento ' +
        'del default. Eventos como ventas de cartera afectan puntualmente a la LGD observada ' +
        '(ej. la bajada de julio 2025).',
      meta: [
        { etiqueta: 'Origen', valor: 'Recobros históricos' },
        { etiqueta: 'Fórmula', valor: '1 − (recobro / EAD)' },
        { etiqueta: 'Dependencias', valor: 'Recobros · EAD' },
        { etiqueta: 'Sensibilidad', valor: 'Ventas de cartera' },
      ],
    },
  },
];

/** Variable del diccionario, enriquecida para el explorador. */
export interface VariableDef {
  variable: string;
  tipo: string;
  descripcion: string;
  origen: string;
  nodeId?: string;                              // nodo de linaje ("ver cómo se construye")
  serie?: 'pd' | 'lgd' | 'defaults';            // serie temporal para la evolución
  distrib?: 'estado' | 'tipo_cliente' | 'dpd';  // distribución
  estado?: 'ok' | 'warning' | 'error';          // estado del dato (conectado a calidad)
  estadoDetalle?: string;
  scope?: string;                               // drill-down de contratos afectados
  porque?: string;                              // por qué cambia / qué la afecta
  usa?: string[];                               // dónde se usa
}

export const DICCIONARIO: VariableDef[] = [
  { variable: 'id_contrato', tipo: 'ID', descripcion: 'Identificador único del expediente', origen: 'core_banking', nodeId: 'core', estado: 'ok', porque: 'Identificador estable; no cambia en el tiempo.', usa: ['Unicidad de expedientes'] },
  { variable: 'fecha_ref', tipo: 'Fecha', descripcion: 'Fecha de referencia mensual', origen: 'ETL', nodeId: 'etl', estado: 'ok', porque: 'Fecha de corte mensual; define la granularidad de todas las series.', usa: ['Todas las series temporales'] },
  { variable: 'estado', tipo: 'Categórica', descripcion: 'Situación de riesgo del expediente', origen: 'Reglas DPD + judicial', nodeId: 'rules', distrib: 'estado', estado: 'warning', estadoDetalle: 'Incoherencia con default en 7 expedientes', scope: 'incoh-default-estado', porque: 'Cambia con los días de impago y con eventos judiciales (entradas/salidas de contencioso).', usa: ['Segmentación por estado', 'Tabla pivot'] },
  { variable: 'dpd', tipo: 'Entero', descripcion: 'Días de impago (Days Past Due)', origen: 'core_banking', nodeId: 'etl', distrib: 'dpd', estado: 'warning', estadoDetalle: '14 contratos con DPD > 90 sin marca de default', scope: 'dpd90-sin-default', porque: 'Aumenta con la morosidad; se reinicia con regularizaciones de pago.', usa: ['Regla de default', 'Tiempo en mora'] },
  { variable: 'default', tipo: 'Binaria', descripcion: 'Indicador de default (0/1)', origen: 'Regla DPD>90', nodeId: 'rules', serie: 'defaults', estado: 'error', estadoDetalle: '7 contratos con default = 1 y estado "Sano"', scope: 'incoh-default-estado', porque: 'Pasa a 1 cuando DPD > 90 o el expediente entra en contencioso; dispara picos como el de 2025-03.', usa: ['Nº defaults', 'Tasas de mora (ODF)'] },
  { variable: 'pd', tipo: 'Decimal', descripcion: 'Probabilidad de default', origen: 'Modelo scoring', nodeId: 'mpd', serie: 'pd', estado: 'ok', porque: 'Sube con la frecuencia de default observada; sensible a entradas en contencioso (pico de 2025-03).', usa: ['KPI PD', 'PD vs LGD', 'Monitorización'] },
  { variable: 'lgd', tipo: 'Decimal', descripcion: 'Severidad de la pérdida', origen: 'Modelo recobros', nodeId: 'mlgd', serie: 'lgd', estado: 'warning', estadoDetalle: '38 contratos sin LGD informada', scope: 'lgd-missing', porque: 'Mide la severidad; baja con ventas de cartera y recobros (caída de 2025-07).', usa: ['KPI LGD', 'PD vs LGD'] },
  { variable: 'tipo_cliente', tipo: 'Categórica', descripcion: 'Segmento de cliente', origen: 'CRM', nodeId: 'core', distrib: 'tipo_cliente', estado: 'ok', porque: 'Atributo de cliente; estable salvo recategorización comercial.', usa: ['Segmentación por driver'] },
];

/** Respuesta scriptada asociada a una variable (para sembrar el chat por contexto). */
export const RESPUESTA_VARIABLE: Record<string, MensajeChat> = {
  pd: PREGUNTAS_SUGERIDAS[0].respuesta,
  estado: PREGUNTAS_SUGERIDAS[1].respuesta,
  lgd: PREGUNTAS_SUGERIDAS[2].respuesta,
};

export const MENSAJE_INICIAL: MensajeChat = {
  rol: 'bot',
  texto:
    '¡Hola! Soy el asistente de conocimiento del dato. Pregúntame de dónde viene una variable, ' +
    'qué significa o cómo se calcula. Tengo integrado el diccionario de variables del modelo.',
};
