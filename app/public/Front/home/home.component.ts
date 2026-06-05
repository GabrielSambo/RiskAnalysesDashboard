import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface FeatureCard {
  title: string;
  description: string;
  route: string;
  icon: string; // SVG path string
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  constructor(private router: Router) {}

  readonly cards: FeatureCard[] = [
    {
      title: 'Talk with Graph',
      description: 'Interactúa con tu Knowledge Graph usando lenguaje natural. Haz preguntas y obtén respuestas directamente de tus datos.',
      route: '/app/chat',
      icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    },
    {
      title: 'Shortest Path',
      description: 'Encuentra el camino más corto entre dos entidades del grafo y descubre cómo están conectadas.',
      route: '/app/shortest-path',
      icon: '',
    },
    {
      title: 'Clustering',
      description: 'Detecta comunidades y grupos de nodos relacionados dentro del grafo usando algoritmos avanzados.',
      route: '/app/clustering',
      icon: '',
    },
    {
      title: 'Centrality',
      description: 'Identifica los nodos más influyentes del grafo mediante PageRank, Betweenness y Degree centrality.',
      route: '/app/centrality',
      icon: '',
    },
  ];

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}
