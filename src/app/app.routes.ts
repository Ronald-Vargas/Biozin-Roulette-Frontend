import { Routes } from '@angular/router';
import { ProfesorComponent } from './components/profesor/profesor';
import { PantallaComponent } from './components/pantalla/pantalla';
import { ControlComponent } from './components/control/control';


export const routes: Routes = [
  { path: '', redirectTo: '/profesor', pathMatch: 'full' },
  { path: 'profesor', component: ProfesorComponent },
  { path: 'pantalla', component: PantallaComponent },
  { path: 'control/:token', component: ControlComponent },
];