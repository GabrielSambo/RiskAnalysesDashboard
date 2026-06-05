import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from '../chart/chart';
import { ContextStore, MetricKey } from '../core/context.store';
import { delta, fmtDelta, fmtNum } from '../core/format';
import {
  SERIE, KPIS, POR_ESTADO, DRIVERS, ODFS, DATA_DRIFT,
  ANOMALIAS, PIVOT, ALERTAS, Anomalia,
} from '../data/mock-data';
import { PREVIEW } from '../data/ingesta';

/** Tarjeta del strip "Qué ha cambiado". */
interface Insight {
  kind: 'anomalia' | 'subida' | 'bajada';
  icon: string;
  titulo: string;
  detalle: string;
  action?: () => void;
}

const METRICS: Record<MetricKey, { label: string; data: number[]; color: string; suffix: string }> = {
  defaults: { label: 'Nº defaults', data: SERIE.defaults, color: '#f59e0b', suffix: '' },
  pd: { label: 'PD media', data: SERIE.pd, color: '#ef4444', suffix: ' %' },
  lgd: { label: 'LGD media', data: SERIE.lgd, color: '#2dd4bf', suffix: ' %' },
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Chart],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  // ---- estado de la UI ----
  readonly kpis = KPIS;
  readonly estados = POR_ESTADO;
  readonly drivers = DRIVERS;
  readonly odfs = ODFS;
  readonly drift = DATA_DRIFT;
  readonly pivot = PIVOT;
  // --- variables procedentes de Ingesta (preview.columnas) ---
  readonly vars = PREVIEW.columnas;
  readonly varA = signal<string>(this.vars.includes('pd') ? 'pd' : this.vars[0]);
  readonly varB = signal<string>(this.vars.includes('lgd') ? 'lgd' : (this.vars.length > 1 ? this.vars[1] : this.vars[0]));
  readonly alertas = ALERTAS;
  readonly metricKeys: MetricKey[] = ['defaults', 'pd', 'lgd'];
  readonly metricLabels = METRICS;

  // El foco compartido (métrica / ventana / anomalía) vive ahora en el ContextStore,
  // de modo que otras secciones (alertas, lineage, chatbot) puedan dirigir esta vista.
  private readonly store = inject(ContextStore);
  readonly selectedMetric = computed<MetricKey>(() => this.store.focus().metric ?? 'defaults');
  readonly windowMonths = computed<number>(() => this.store.focus().window);
  readonly explicacion = this.store.activeAnomaly;
  readonly agentOpen = computed(() => this.store.agentOpen());

  // estado puramente local de UI (no necesita compartirse)
  readonly selectedDriver = signal<number>(0);

  readonly errores = ALERTAS.filter(a => a.nivel === 'error').length;
  readonly warnings = ALERTAS.filter(a => a.nivel === 'warning').length;

  // índice de inicio según la ventana temporal seleccionada
  private readonly startIdx = computed(() => Math.max(0, SERIE.fechas.length - this.windowMonths()));
  readonly fechasVentana = computed(() => SERIE.fechas.slice(this.startIdx()));

  setMetric(m: MetricKey) { this.store.setMetric(m); }
  setWindow(m: number) { this.store.setWindow(m as 6 | 12 | 24); }
  setDriver(i: number) { this.selectedDriver.set(i); }
  closeExplicacion() { this.store.focusAnomaly(null); }

  setVarA(v: string) { this.varA.set(v); }
  setVarB(v: string) { this.varB.set(v); }

  onVarAChange(e: Event) { const v = (e.target as HTMLSelectElement | null)?.value; if (v) this.varA.set(v); }
  onVarBChange(e: Event) { const v = (e.target as HTMLSelectElement | null)?.value; if (v) this.varB.set(v); }

  // ---- click-to-explain sobre la serie principal ----
  onMainPointClick(e: { dataIndex: number }) {
    const fecha = this.fechasVentana()[e.dataIndex];
    const metric = this.selectedMetric();
    const anomalia = ANOMALIAS.find(a => a.fecha === fecha && a.serie === metric);
    if (anomalia) {
      this.store.focusAnomaly(anomalia);
      this.store.openAgent();
    }
  }

  abrirAnomalia(a: Anomalia) {
    this.store.focusAnomaly(a);
  }

  // ---- strip "Qué ha cambiado": anomalías priorizadas + top mover ↑/↓ ----
  private readonly moverSeries = [
    { key: 'defaults', label: 'Nº defaults', arr: SERIE.defaults, unit: '', dec: 0 },
    { key: 'pd', label: 'PD media', arr: SERIE.pd, unit: ' pp', dec: 2 },
    { key: 'lgd', label: 'LGD media', arr: SERIE.lgd, unit: ' pp', dec: 1 },
    { key: 'contratos', label: 'Nº contratos', arr: SERIE.contratos, unit: '', dec: 0 },
  ];

  readonly insights = computed<Insight[]>(() => {
    const fechas = this.fechasVentana();
    const out: Insight[] = [];

    // 1) anomalías dentro de la ventana, una tarjeta por fecha (la primera de cada fecha)
    const vistas = new Set<string>();
    for (const a of ANOMALIAS) {
      if (!fechas.includes(a.fecha) || vistas.has(a.fecha)) continue;
      vistas.add(a.fecha);
      out.push({
        kind: 'anomalia',
        icon: '⚠',
        titulo: a.titulo,
        detalle: `${a.serie.toUpperCase()} · ${a.fecha}`,
        action: () => this.store.focusAnomaly(a),
      });
    }

    // 2) top mover ↑ y ↓ (variación intermensual del último cierre)
    const movers = this.moverSeries.map(s => {
      const n = s.arr.length;
      return { ...s, d: delta(s.arr[n - 1], s.arr[n - 2]) };
    });
    const riser = movers.filter(m => m.d.dir === 'up').sort((a, b) => b.d.pct - a.d.pct)[0];
    const faller = movers.filter(m => m.d.dir === 'down').sort((a, b) => a.d.pct - b.d.pct)[0];
    if (riser) out.push({
      kind: 'subida', icon: '▲', titulo: `Top subida · ${riser.label}`,
      detalle: `${fmtDelta(riser.d, { unit: riser.unit, decimals: riser.dec })} (${fmtNum(riser.d.pct, 1)}%) vs mes ant.`,
    });
    if (faller) out.push({
      kind: 'bajada', icon: '▼', titulo: `Top bajada · ${faller.label}`,
      detalle: `${fmtDelta(faller.d, { unit: faller.unit, decimals: faller.dec })} (${fmtNum(faller.d.pct, 1)}%) vs mes ant.`,
    });
    return out;
  });

  // ---- drill-down de contratos: abre el modal compartido con el scope de la anomalía ----
  verContratos() {
    const a = this.explicacion();
    if (a?.scope) this.store.openContracts(a.scope);
  }

  // ---- "ver cómo se construye": salta al linaje con el nodo origen enfocado ----
  verLinaje() {
    const a = this.explicacion();
    if (a?.nodeId) this.store.goToLineageNode(a.nodeId);
  }

  // ---- "preguntar al asistente": salta al conocimiento del dato con la variable enfocada ----
  preguntarAsistente() {
    const a = this.explicacion();
    if (!a) return;
    this.store.goToVariable(a.serie === 'defaults' ? 'default' : a.serie);
  }

  private grid = { left: 48, right: 24, top: 28, bottom: 36 };
  private axisStyle = {
    axisLine: { lineStyle: { color: '#33415588' } },
    axisLabel: { color: '#94a3b8' },
    splitLine: { lineStyle: { color: '#1e293b' } },
  };

  // ---- opción de la serie principal con marcado de anomalías ----
  readonly mainOption = computed(() => {
    const key = this.selectedMetric();
    const cfg = METRICS[key];
    const start = this.startIdx();
    const data = cfg.data.slice(start);
    const fechas = this.fechasVentana();

    const markPoints = ANOMALIAS
      .filter(a => a.serie === key && fechas.includes(a.fecha))
      .map(a => {
        const i = fechas.indexOf(a.fecha);
        return {
          coord: [i, data[i]],
          value: a.tipo === 'caida' ? '▼' : '▲',
          itemStyle: { color: a.tipo === 'caida' ? '#60a5fa' : '#ef4444' },
        };
      });

    return {
      tooltip: { trigger: 'axis', backgroundColor: '#0f172a', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
      grid: this.grid,
      xAxis: { type: 'category', data: fechas, boundaryGap: false, ...this.axisStyle },
      yAxis: { type: 'value', scale: true, ...this.axisStyle },
      series: [{
        name: cfg.label,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        data,
        lineStyle: { width: 3, color: cfg.color },
        itemStyle: { color: cfg.color },
        areaStyle: { color: cfg.color + '22' },
        markPoint: {
          symbol: 'pin', symbolSize: 34,
          label: { color: '#fff', fontSize: 11 },
          data: markPoints,
        },
      }],
    } as any;
  });

  // ---- PD vs LGD (doble eje) ----
  readonly pdLgdOption = computed(() => {
    const start = this.startIdx();
    const fechas = this.fechasVentana();
    return {
      tooltip: { trigger: 'axis', backgroundColor: '#0f172a', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
      legend: { data: ['PD media', 'LGD media'], textStyle: { color: '#cbd5e1' }, top: 0 },
      grid: { ...this.grid, top: 36 },
      xAxis: { type: 'category', data: fechas, boundaryGap: false, ...this.axisStyle },
      yAxis: [
        { type: 'value', name: 'PD %', scale: true, ...this.axisStyle },
        { type: 'value', name: 'LGD %', scale: true, ...this.axisStyle, splitLine: { show: false } },
      ],
      series: [
        { name: 'PD media', type: 'line', smooth: true, data: SERIE.pd.slice(start), lineStyle: { color: '#ef4444', width: 2 }, itemStyle: { color: '#ef4444' } },
        { name: 'LGD media', type: 'line', yAxisIndex: 1, smooth: true, data: SERIE.lgd.slice(start), lineStyle: { color: '#2dd4bf', width: 2 }, itemStyle: { color: '#2dd4bf' } },
      ],
    } as any;
  });

  // ---- ODFs: dos tasas de mora, una debajo de otra (dos grids) ----
  readonly odfOption = computed(() => {
    const start = this.startIdx();
    const fechas = this.fechasVentana();
    return {
      tooltip: { trigger: 'axis', backgroundColor: '#0f172a', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
      grid: [
        { left: 48, right: 24, top: 28, height: '32%' },
        { left: 48, right: 24, top: '62%', height: '30%' },
      ],
      xAxis: [
        { type: 'category', data: fechas, boundaryGap: false, gridIndex: 0, ...this.axisStyle },
        { type: 'category', data: fechas, boundaryGap: false, gridIndex: 1, ...this.axisStyle },
      ],
      yAxis: [
        { type: 'value', scale: true, gridIndex: 0, name: 'ODF 90+ %', ...this.axisStyle },
        { type: 'value', scale: true, gridIndex: 1, name: 'ODF 30+ %', ...this.axisStyle },
      ],
      series: [
        { name: ODFS[0].nombre, type: 'line', smooth: true, data: ODFS[0].valores.slice(start), xAxisIndex: 0, yAxisIndex: 0, lineStyle: { color: '#818cf8', width: 2 }, itemStyle: { color: '#818cf8' }, areaStyle: { color: '#818cf822' } },
        { name: ODFS[1].nombre, type: 'line', smooth: true, data: ODFS[1].valores.slice(start), xAxisIndex: 1, yAxisIndex: 1, lineStyle: { color: '#f472b6', width: 2 }, itemStyle: { color: '#f472b6' }, areaStyle: { color: '#f472b622' } },
      ],
    } as any;
  });

  // ---- Segmentación por estado (donut) ----
  readonly estadoOption = computed(() => ({
    tooltip: { trigger: 'item', backgroundColor: '#0f172a', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
    legend: { orient: 'vertical', right: 4, top: 'center', textStyle: { color: '#cbd5e1' } },
    series: [{
      type: 'pie', radius: ['52%', '74%'], center: ['38%', '50%'], avoidLabelOverlap: true,
      itemStyle: { borderColor: '#0b1220', borderWidth: 2 },
      label: { show: false }, labelLine: { show: false },
      data: POR_ESTADO.map(s => ({ name: s.estado, value: s.contratos, itemStyle: { color: s.color } })),
    }],
  } as any));

  // ---- Drivers (barras) ----
  readonly driverOption = computed(() => {
    const d = DRIVERS[this.selectedDriver()];
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#0f172a', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
      grid: this.grid,
      xAxis: { type: 'category', data: d.buckets.map(b => b.etiqueta), ...this.axisStyle },
      yAxis: { type: 'value', ...this.axisStyle },
      series: [{
        type: 'bar', data: d.buckets.map(b => b.valor),
        itemStyle: { color: '#38bdf8', borderRadius: [4, 4, 0, 0] }, barWidth: '52%',
      }],
    } as any;
  });

    // ---- Comparativa configurable (dos variables desde Ingesta) ----
    readonly compareOption = computed(() => {
      const labels = SERIE.fechas.slice(-8);
      const makeSeries = (variable: string, offset: number) =>
        labels.map((_, idx) => {
          const base = variable
            .split('')
            .reduce((sum, c) => sum + c.charCodeAt(0), 0);
          return Math.round((Math.sin((base + idx * 7 + offset) / 12) * 18 + 24) * 10) / 10;
        });

      const seriesA = makeSeries(this.varA(), 0);
      const seriesB = makeSeries(this.varB(), 23);

      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'line' },
          backgroundColor: '#0f172a',
          borderColor: '#334155',
          textStyle: { color: '#e2e8f0' },
        },
        legend: {
          data: [this.varA(), this.varB()],
          textStyle: { color: '#cbd5e1' },
          top: 0,
        },
        grid: { ...this.grid, top: 50 },
        xAxis: { type: 'category', data: labels, ...this.axisStyle, name: 'Fecha' },
        yAxis: { type: 'value', ...this.axisStyle, name: 'Valor' },
        series: [
          {
            name: this.varA(),
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            data: seriesA,
            lineStyle: { width: 2, color: '#60a5fa' },
            itemStyle: { color: '#60a5fa' },
          },
          {
            name: this.varB(),
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            data: seriesB,
            lineStyle: { width: 2, color: '#f59e0b' },
            itemStyle: { color: '#f59e0b' },
          },
        ],
      } as any;
    });

  // ---- Data drift (barras agrupadas A vs B) ----
  readonly driftOption = computed(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#0f172a', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
    legend: { data: [DATA_DRIFT.ventanaA, DATA_DRIFT.ventanaB], textStyle: { color: '#cbd5e1' }, top: 0 },
    grid: { ...this.grid, top: 36 },
    xAxis: { type: 'category', data: DATA_DRIFT.bins.map(b => b.bucket), ...this.axisStyle },
    yAxis: { type: 'value', name: '%', ...this.axisStyle },
    series: [
      { name: DATA_DRIFT.ventanaA, type: 'bar', data: DATA_DRIFT.bins.map(b => b.ventanaA), itemStyle: { color: '#475569', borderRadius: [3, 3, 0, 0] } },
      { name: DATA_DRIFT.ventanaB, type: 'bar', data: DATA_DRIFT.bins.map(b => b.ventanaB), itemStyle: { color: '#f59e0b', borderRadius: [3, 3, 0, 0] } },
    ],
  } as any));
}
