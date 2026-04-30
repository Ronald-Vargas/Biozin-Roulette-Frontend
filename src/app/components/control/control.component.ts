import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { RouletteService } from '../../services/roulette';

@Component({
  selector: 'app-control',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.scss']
})
export class ControlComponent implements OnInit, OnDestroy {
  
  token: string = '';
  nombres: string[] = [];
  targetIndex: number | null = null;
  historial: string[] = [];
  conectado: boolean = false;
  modoForzado: boolean = true;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private rouletteService: RouletteService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Obtener el token de la URL
    this.route.params.subscribe(params => {
      this.token = params['token'] || 'secreto';
      document.title = 'Notas'; // Camuflar la pestaña
    });
    
    // Conectar al WebSocket
    this.rouletteService.connect('sala-default');
    
    // Suscribirse al estado de control
    this.subscriptions.push(
      this.rouletteService.controlState$.subscribe(state => {
        if (state) {
          this.nombres = state.nombres;
          this.targetIndex = state.targetIndex;
          this.historial = state.historial;
        }
      })
    );
    
    // Suscribirse a estado de conexión
    this.subscriptions.push(
      this.rouletteService.connected$.subscribe(conectado => {
        this.conectado = conectado;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    document.title = 'Ruleta'; // Restaurar título
  }

  /**
   * Cambiar entre modo forzado y aleatorio
   */
  toggleModo(forzado: boolean): void {
    this.modoForzado = forzado;
    if (!forzado) {
      // Si cambia a aleatorio, deseleccionar
      this.seleccionarNombre(null);
    }
  }

  /**
   * Seleccionar un nombre para forzar
   */
  seleccionarNombre(index: number | null): void {
    if (!this.modoForzado && index !== null) {
      return; // No permitir selección en modo aleatorio
    }
    
    // Toggle: si ya está seleccionado, deseleccionar
    if (this.targetIndex === index) {
      this.rouletteService.setTarget(null);
    } else {
      this.rouletteService.setTarget(index);
    }
  }

  /**
   * Verificar si un nombre está seleccionado
   */
  isSelected(index: number): boolean {
    return this.targetIndex === index;
  }
}