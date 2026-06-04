/** Sección 1 · Ingesta de datos — datos hardcodeados */

export interface Fuente {
  tipo: 'Excel' | 'CSV' | 'BBDD';
  icono: string;
  nombre: string;
  estado: 'cargado' | 'procesando' | 'error';
  filas: number;
  columnas: number;
  rangoFechas: string;
  peso: string;
}

export const FUENTES: Fuente[] = [
  { tipo: 'Excel', icono: '📊', nombre: 'cartera_riesgo_2025.xlsx', estado: 'cargado', filas: 13070, columnas: 42, rangoFechas: '2024-01 → 2025-12', peso: '8,4 MB' },
  { tipo: 'CSV', icono: '📄', nombre: 'movimientos_contencioso.csv', estado: 'cargado', filas: 4820, columnas: 18, rangoFechas: '2024-01 → 2025-12', peso: '2,1 MB' },
  { tipo: 'BBDD', icono: '🗄️', nombre: 'core_banking.expedientes', estado: 'cargado', filas: 13070, columnas: 67, rangoFechas: '2019-03 → 2025-12', peso: '— conexión live' },
];

export interface PreviewTabla {
  columnas: string[];
  filas: (string | number)[][];
}

export const PREVIEW: PreviewTabla = {
  columnas: ['id_contrato', 'fecha_ref', 'estado', 'dpd', 'default', 'pd', 'lgd', 'tipo_cliente'],
  filas: [
    ['CT-008412', '2025-12', 'Sano', 0, 0, '1,9%', '40,2%', 'Particular'],
    ['CT-008419', '2025-12', 'Incumplimiento', 47, 0, '8,4%', '44,1%', 'Autónomo'],
    ['CT-008431', '2025-12', 'Contencioso', 128, 1, '—', '52,8%', 'Pyme'],
    ['CT-008440', '2025-12', 'Cura', 12, 0, '3,1%', '38,9%', 'Particular'],
    ['CT-008455', '2025-12', 'Sano', 0, 0, '2,2%', '41,0%', 'Corporativo'],
    ['CT-008467', '2025-12', 'Subjetivo', 0, 1, '6,7%', '45,5%', 'Pyme'],
    ['CT-008470', '2025-12', 'Incumplimiento', 63, 0, '9,2%', '43,7%', 'Particular'],
  ],
};

export interface ValidacionIngesta {
  check: string;
  estado: 'ok' | 'warning' | 'error';
  detalle: string;
}

export const VALIDACIONES_INGESTA: ValidacionIngesta[] = [
  { check: 'Formato de fechas', estado: 'ok', detalle: 'Todas las fechas en formato ISO válido (YYYY-MM).' },
  { check: 'Columnas clave presentes', estado: 'ok', detalle: 'id_contrato, fecha_ref, estado, default — presentes.' },
  { check: 'Filas vacías', estado: 'ok', detalle: '0 filas completamente vacías.' },
  { check: 'Tipos de dato', estado: 'warning', detalle: '12 valores de "pd" como texto ("—") en contratos en contencioso.' },
  { check: 'Cobertura temporal', estado: 'ok', detalle: '24 meses continuos sin huecos (2024-01 a 2025-12).' },
];
