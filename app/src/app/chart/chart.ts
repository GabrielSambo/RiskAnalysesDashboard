import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import * as echarts from 'echarts';

/**
 * Envoltorio mínimo y reutilizable sobre Apache ECharts.
 * Se le pasa una `option` de ECharts y emite los clicks sobre puntos de datos
 * (necesario para la explicabilidad: click en un punto -> abrir explicación).
 */
@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<div #host class="chart-host" [style.height]="height"></div>`,
  styles: [`.chart-host { width: 100%; }`],
})
export class Chart implements AfterViewInit, OnChanges, OnDestroy {
  @Input() option: echarts.EChartsCoreOption | null = null;
  @Input() height = '320px';
  @Output() pointClick = new EventEmitter<{ seriesName: string; dataIndex: number; value: unknown }>();

  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;
  private instance: echarts.ECharts | null = null;
  private resizeObs?: ResizeObserver;

  ngAfterViewInit(): void {
    this.instance = echarts.init(this.host.nativeElement, undefined, { renderer: 'canvas' });
    this.instance.on('click', (params: any) => {
      if (params?.componentType === 'series') {
        this.pointClick.emit({
          seriesName: params.seriesName,
          dataIndex: params.dataIndex,
          value: params.value,
        });
      }
    });
    this.render();
    this.resizeObs = new ResizeObserver(() => this.instance?.resize());
    this.resizeObs.observe(this.host.nativeElement);
  }

  ngOnChanges(): void {
    this.render();
  }

  private render(): void {
    if (this.instance && this.option) {
      this.instance.setOption(this.option, true);
    }
  }

  ngOnDestroy(): void {
    this.resizeObs?.disconnect();
    this.instance?.dispose();
  }
}
