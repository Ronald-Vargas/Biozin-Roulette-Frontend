import { Routes } from '@angular/router';
import { ControlComponent } from './components/control/control.component';
import { PantallaComponent } from './components/pantalla/pantalla.component';
import { HomeComponent } from './components/home/home.component';
import { AdministradorComponent } from './components/administrador/administrador.component';


export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'administrador', component: AdministradorComponent },
  { path: 'pantalla', component: PantallaComponent },
  { path: 'control/:token', component: ControlComponent },
];