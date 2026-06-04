import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { Dashboard } from './dashboard/dashboard';
import { Ingesta } from './sections/ingesta';
import { Conocimiento } from './sections/conocimiento';
import { Trazabilidad } from './sections/trazabilidad';
import { Calidad } from './sections/calidad';
import { Monitorizacion } from './sections/monitorizacion';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'ingesta', component: Ingesta },
      { path: 'conocimiento', component: Conocimiento },
      { path: 'trazabilidad', component: Trazabilidad },
      { path: 'calidad', component: Calidad },
      { path: 'dashboard', component: Dashboard },
      { path: 'monitorizacion', component: Monitorizacion },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
