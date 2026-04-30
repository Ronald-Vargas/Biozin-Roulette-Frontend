import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GiroResponse {
  tipo: string;
  nombres: string[];
  targetIndex: number;
  targetName: string;
  finalRotation: number;
  duration: number;
  timestamp: number;
}

export interface NombresUpdate {
  tipo: string;
  nombres: string[];
}

export interface ControlState {
  tipo: string;
  nombres: string[];
  targetIndex: number | null;
  historial: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RouletteService {
  
  private stompClient: Client | null = null;
  private salaId: string = 'sala-default';
  
  // Observables para compartir datos entre componentes
  private nombresSubject = new BehaviorSubject<string[]>([]);
  private giroSubject = new BehaviorSubject<GiroResponse | null>(null);
  private controlStateSubject = new BehaviorSubject<ControlState | null>(null);
  private connectedSubject = new BehaviorSubject<boolean>(false);
  
  public nombres$ = this.nombresSubject.asObservable();
  public giro$ = this.giroSubject.asObservable();
  public controlState$ = this.controlStateSubject.asObservable();
  public connected$ = this.connectedSubject.asObservable();

  constructor() {}

  /**
   * Conectar al WebSocket del backend
   */
  connect(salaId: string): void {
    this.salaId = salaId;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      debug: (str) => {
        console.log('STOMP:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      console.log('✅ Conectado al WebSocket');
      this.connectedSubject.next(true);

      // Suscribirse al topic público (profesor + pantalla)
      this.stompClient?.subscribe(`/topic/sala/${this.salaId}/publico`, (message: IMessage) => {
        const data = JSON.parse(message.body);
        console.log('📨 Mensaje público:', data);
        
        if (data.tipo === 'GIRO') {
          this.giroSubject.next(data as GiroResponse);
        } else if (data.tipo === 'NOMBRES_UPDATE') {
          this.nombresSubject.next(data.nombres);
        }
      });

      // Suscribirse al topic de control (solo admin)
      this.stompClient?.subscribe(`/topic/sala/${this.salaId}/control`, (message: IMessage) => {
        const data = JSON.parse(message.body);
        console.log('🔐 Mensaje control:', data);
        
        if (data.tipo === 'CONTROL_STATE') {
          this.controlStateSubject.next(data as ControlState);
        }
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('❌ Error STOMP:', frame);
      this.connectedSubject.next(false);
    };

    this.stompClient.activate();
  }

  /**
   * Desconectar
   */
  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.connectedSubject.next(false);
      console.log('👋 Desconectado');
    }
  }

  /**
   * Agregar/actualizar nombres
   */
  agregarNombres(nombres: string[]): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('No conectado');
      return;
    }

    const payload = {
      salaId: this.salaId,
      nombres: nombres
    };

    this.stompClient.publish({
      destination: '/app/sala/agregar-nombres',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Eliminar un nombre por índice
   */
  eliminarNombre(index: number): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('No conectado');
      return;
    }

    const payload = {
      salaId: this.salaId,
      index: index
    };

    this.stompClient.publish({
      destination: '/app/sala/eliminar-nombre',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Establecer el target (forzar ganador) - solo desde vista control
   */
  setTarget(targetIndex: number | null): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('No conectado');
      return;
    }

    const payload = {
      salaId: this.salaId,
      targetIndex: targetIndex
    };

    this.stompClient.publish({
      destination: '/app/sala/set-target',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Girar la ruleta
   */
  girar(): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('No conectado');
      return;
    }

    const payload = {
      salaId: this.salaId
    };

    this.stompClient.publish({
      destination: '/app/sala/girar',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Obtener el estado actual de nombres
   */
  getNombresActuales(): string[] {
    return this.nombresSubject.value;
  }
}
