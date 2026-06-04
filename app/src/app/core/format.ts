/**
 * E5 · Utilidades de formato y deltas (es-ES).
 * Funciones puras, sin estado. Centraliza el formateo de números/porcentajes y el
 * cálculo de variaciones (▲/▼ vs periodo anterior) que antes estaba duplicado en
 * varios componentes.
 */

export type Direccion = 'up' | 'down' | 'flat';

export interface Delta {
  abs: number;       // variación absoluta (curr - prev)
  pct: number;       // variación relativa en %
  dir: Direccion;    // signo
  arrow: '▲' | '▼' | '▬';
}

/** Variación de `curr` respecto a `prev`. */
export function delta(curr: number, prev: number): Delta {
  const abs = curr - prev;
  const pct = prev !== 0 ? (abs / prev) * 100 : 0;
  const dir: Direccion = abs > 0 ? 'up' : abs < 0 ? 'down' : 'flat';
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '▬';
  return { abs, pct, dir, arrow };
}

/** Número con separadores es-ES ('.' miles, ',' decimales). */
export function fmtNum(n: number, decimals = 0): string {
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Porcentaje formateado, p. ej. "2,52 %". */
export function fmtPct(n: number, decimals = 2): string {
  return fmtNum(n, decimals) + ' %';
}

/** Delta formateado con flecha y signo, p. ej. "▲ +0,33 pp" o "▼ -6,0 %". */
export function fmtDelta(d: Delta, opts: { unit?: string; decimals?: number } = {}): string {
  const { unit = '', decimals = 2 } = opts;
  const sign = d.dir === 'up' ? '+' : d.dir === 'down' ? '-' : '';
  return `${d.arrow} ${sign}${fmtNum(Math.abs(d.abs), decimals)}${unit}`;
}
