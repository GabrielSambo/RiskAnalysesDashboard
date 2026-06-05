import { Contrato } from './contratos';
import { Check } from './calidad';

type BusinessRuleSeverity = 'warning' | 'error';

interface BusinessRuleDefinition {
  name: string;
  category: string;
  severity: BusinessRuleSeverity;
  impact: string;
  scope?: string;
  evaluate: (row: Contrato) => boolean;
  detail: (count: number) => string;
}

export const BUSINESS_RULES: BusinessRuleDefinition[] = [
  {
    name: 'DPD >= 90 → default',
    category: 'Default',
    severity: 'warning',
    impact: 'El default debe reflejar la morosidad extrema.',
    detail: count => `${count} contratos con DPD >= 90 sin marca de default.`,
    evaluate: row => row.dpd >= 90 && row.default === 0,
  },
  {
    name: 'Default vs estado',
    category: 'Coherencia',
    severity: 'error',
    impact: 'Incoherencias entre default y estado distorsionan la valoración de riesgo.',
    detail: count => `${count} contratos con default = 1 y estado "Sano".`,
    evaluate: row => row.default === 1 && row.estado === 'Sano',
  }
];
    