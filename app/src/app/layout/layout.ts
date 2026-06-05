import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AgentPanel } from '../shared/agent-panel';
import { ContractsModal } from '../shared/contracts-modal';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, AgentPanel, ContractsModal],
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss'],
})
export class Layout {
  readonly nav = [
    { ruta: '/ingesta', num: 1, icono: '', titulo: 'Ingesta de datos' },
    { ruta: '/conocimiento', num: 2, icono: '', titulo: 'Conocimiento del dato' },
    { ruta: '/trazabilidad', num: 3, icono: '', titulo: 'Trazabilidad' },
    { ruta: '/calidad', num: 4, icono: '', titulo: 'Control de calidad + agente' },
    { ruta: '/dashboard', num: 5, icono: '', titulo: 'Dashboard principal' },
    { ruta: '/monitorizacion', num: 6, icono: '', titulo: 'Monitorización del modelo' },
  ];
}
