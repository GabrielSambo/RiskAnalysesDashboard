import { Contrato } from './contratos';
import { Check } from './calidad';

type DataQualitySeverity = 'warning' | 'error';

interface DataQualityRuleDefinition {
  name: string;
  category: string;
  severity: DataQualitySeverity;
  impact: string;
  scope?: string;
  evaluate: (row: Contrato, context: DataQualityContext) => boolean;
  detail: (count: number) => string;
}

interface DataQualityContext {
  duplicateKeys: Record<string, number>;
}

function buildDuplicateKeys(rows: Contrato[]) {
  return rows.reduce<Record<string, number>>((map, row) => {
    const key = `${row.id}:${row.fecha_ref}`;
    map[key] = (map[key] ?? 0) + 1;
    return map;
  }, {});
}

export const DATA_QUALITY_RULES: DataQualityRuleDefinition[] = [
  {
    name: 'Valores missing',
    category: 'Completitud',
    severity: 'warning',
    impact: 'Sesga análisis agregados cuando faltan valores clave',
    detail: count => `${count} contratos sin LGD informada en el cierre 2025-12.`,
    evaluate: row => row.lgd === null,
  },
  {
    name: 'Valores fuera de rango',
    category: 'Rango',
    severity: 'error',
    impact: 'Datos atípicos o erróneos pueden invalidar modelos y KPIs',
    detail: count => `${count} contratos con campos fuera de rango o negativos.`,
    evaluate: row => row.dpd < 0 || row.ead < 0 || row.pd < 0 || row.pd > 100 || (row.lgd !== null && (row.lgd < 0 || row.lgd > 100)),
  },
  {
    name: 'Duplicados',
    category: 'Unicidad',
    severity: 'error',
    impact: 'Registros duplicados distorsionan totales y medias',
    detail: count => `${count} contratos duplicados por (id_contrato, fecha_ref).`,
    evaluate: (_row, context) => context.duplicateKeys[`${_row.id}:${_row.fecha_ref}`] > 1,
  },
  {
    name: 'Consistencia de tipos',
    category: 'Tipo',
    severity: 'warning',
    impact: 'Errores de formato pueden romper pipelines y transformaciones',
    detail: count => `${count} registros con tipos inconsistentes.`,
    evaluate: row => typeof row.id !== 'string' || typeof row.fecha_ref !== 'string' || typeof row.dpd !== 'number' || typeof row.pd !== 'number' || typeof row.ead !== 'number' || (row.lgd !== null && typeof row.lgd !== 'number'),
  },
];

export function runDataQualityChecks(data: Contrato[]) {
  const duplicateKeys = buildDuplicateKeys(data);
  const checks: Check[] = DATA_QUALITY_RULES.map(rule => {
    const affected = data.filter(row => rule.evaluate(row, { duplicateKeys })).length;
    const resultado = affected === 0 ? 'ok' : rule.severity;
    const detalle = affected === 0 ? 'Sin problemas detectados en este control.' : rule.detail(affected);
    return {
      categoria: rule.category,
      nombre: rule.name,
      resultado,
      detalle,
      impacto: rule.impact,
      afectados: affected,
      scope: rule.scope,
    };
  });

  const errorCount = checks.filter(check => check.resultado === 'error').length;
  const warningCount = checks.filter(check => check.resultado === 'warning').length;
  const okCount = checks.filter(check => check.resultado === 'ok').length;

  return {
    checks,
    errorCount,
    warningCount,
    okCount,
    totalChecks: checks.length,
    summary: `Se ejecutaron ${checks.length} controles técnicos de calidad. ${errorCount} errores, ${warningCount} warnings.`,
  };
}
