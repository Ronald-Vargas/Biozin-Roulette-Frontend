import { Routes } from '@angular/router';
import { ControlComponent } from './components/control/control.component';
import { PantallaComponent } from './components/pantalla/pantalla.component';
import { ProfesorComponent } from './components/profesor/profesor.component';
import { HomeComponent } from './components/home/home.component';


export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'profesor', component: ProfesorComponent },
  { path: 'pantalla', component: PantallaComponent },
  { path: 'control/:token', component: ControlComponent },
];