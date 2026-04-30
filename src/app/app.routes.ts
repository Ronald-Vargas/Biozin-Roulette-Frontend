import { Routes } from '@angular/router';
import { ControlComponent } from './components/control/control';
import { PantallaComponent } from './components/pantalla/pantalla';
import { ProfesorComponent } from './components/profesor/profesor.component';


export const routes: Routes = [
  { path: '', redirectTo: '/profesor', pathMatch: 'full' },
  { path: 'profesor', component: ProfesorComponent },
  { path: 'pantalla', component: PantallaComponent },
  { path: 'control/:token', component: ControlComponent },
];