import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FUENTES, PREVIEW, VALIDACIONES_INGESTA } from '../data/ingesta';

@Component({
  selector: 'app-ingesta',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="page">
    <div class="page-head">
      <span class="eyebrow">01 · Ingesta</span>
      <h1>Ingesta de datos</h1>
      <p>Carga desde Excel, CSV o base de datos. Vista rápida de tablas y preview para validar que los datos están bien cargados antes de procesar.</p>
    </div>

    <div class="grid3">
      <div class="card src" *ngFor="let f of fuentes">
        <div class="src-top">
          <span class="src-ico">{{ f.icono }}</span>
          <span class="pill ok" *ngIf="f.estado === 'cargado'">cargado</span>
        </div>
        <strong class="src-name">{{ f.nombre }}</strong>
        <span class="src-type">{{ f.tipo }}</span>
        <div class="src-stats">
          <div><span class="n">{{ f.filas | number:'1.0-0' }}</span><span class="l">filas</span></div>
          <div><span class="n">{{ f.columnas }}</span><span class="l">columnas</span></div>
        </div>
        <div class="src-meta">{{ f.rangoFechas }} · {{ f.peso }}</div>
      </div>
    </div>

    <div class="card">
      <h2>Preview · core_banking.expedientes (cierre 2025-12)</h2>
      <div class="tbl-wrap">
        <table class="tbl mono">
          <thead><tr><th *ngFor="let c of preview.columnas">{{ c }}</th></tr></thead>
          <tbody>
            <tr *ngFor="let row of preview.filas">
              <td *ngFor="let cell of row">{{ cell }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h2>Validación de carga</h2>
      <div class="val" *ngFor="let v of validaciones">
        <span class="pill" [ngClass]="v.estado">{{ v.estado }}</span>
        <div class="val-txt"><strong>{{ v.check }}</strong><span>{{ v.detalle }}</span></div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .src { display: flex; flex-direction: column; gap: 6px; }
    .src-top { display: flex; justify-content: space-between; align-items: center; }
    .src-ico { font-size: 26px; }
    .src-name { font-size: 13.5px; word-break: break-all; }
    .src-type { font-size: 11px; color: var(--muted); }
    .src-stats { display: flex; gap: 22px; margin: 10px 0 6px; }
    .src-stats .n { font-size: 21px; font-weight: 700; display: block; }
    .src-stats .l { font-size: 11px; color: var(--muted); }
    .src-meta { font-size: 11.5px; color: var(--muted); border-top: 1px solid var(--border); padding-top: 8px; }
    .tbl-wrap { overflow-x: auto; }
    .val { display: flex; align-items: center; gap: 14px; padding: 11px 0; border-bottom: 1px dashed var(--border); }
    .val:last-child { border-bottom: none; }
    .val .pill { text-transform: capitalize; min-width: 64px; text-align: center; }
    .val-txt { display: flex; flex-direction: column; gap: 2px; }
    .val-txt strong { font-size: 13.5px; }
    .val-txt span { font-size: 12.5px; color: var(--muted); }
  `],
})
export class Ingesta {
  readonly fuentes = FUENTES;
  readonly preview = PREVIEW;
  readonly validaciones = VALIDACIONES_INGESTA;
}
