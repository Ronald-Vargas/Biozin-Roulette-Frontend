import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GiroResponse, RouletteService } from '../../services/roulette';

@Component({
  selector: 'app-profesor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profesor.component.html',
  styleUrls: ['./profesor.component.scss']
})
export class ProfesorComponent implements OnInit, OnDestroy {
  
  @ViewChild('wheelCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  nombres: string[] = [];
  nuevoNombre: string = '';
  girando: boolean = false;
  ganador: string = '';
  conectado: boolean = false;
  
  private subscriptions: Subscription[] = [];
  private ctx: CanvasRenderingContext2D | null = null;
  private currentRotation: number = 0;
  
  private readonly COLORS = [
    '#c5483b', '#d4a851', '#5fb37a', '#4a7c8c',
    '#a8688f', '#d97a3f', '#e8b86a', '#7a9e7e'
  ];

  constructor(private rouletteService: RouletteService) {}

  ngOnInit(): void {
    // Conectar al WebSocket
    this.rouletteService.connect('sala-default');
    
    // Suscribirse a cambios de nombres
    this.subscriptions.push(
      this.rouletteService.nombres$.subscribe(nombres => {
        this.nombres = nombres;
        this.dibujarRuleta();
      })
    );
    
    // Suscribirse a giros
    this.subscriptions.push(
      this.rouletteService.giro$.subscribe(giro => {
        if (giro) {
          this.ejecutarGiro(giro);
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
    this.rouletteService.disconnect();
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    this.dibujarRuleta();
  }

  /**
   * Agregar nombre a la lista
   */
  agregarNombre(): void {
    if (this.nuevoNombre.trim()) {
      const nombresActualizados = [...this.nombres, this.nuevoNombre.trim()];
      this.rouletteService.agregarNombres(nombresActualizados);
      this.nuevoNombre = '';
    }
  }

  /**
   * Eliminar nombre por índice
   */
  eliminarNombre(index: number): void {
    this.rouletteService.eliminarNombre(index);
  }

  /**
   * Girar la ruleta
   */
  girar(): void {
    if (this.nombres.length === 0 || this.girando) {
      return;
    }
    this.ganador = '';
    this.rouletteService.girar();
  }

  /**
   * Ejecutar la animación del giro
   */
  private ejecutarGiro(giro: GiroResponse): void {
    this.girando = true;
    const startTime = performance.now();
    const duration = giro.duration;
    const finalRotation = giro.finalRotation;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      
      this.currentRotation = finalRotation * eased;
      this.dibujarRuleta();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.girando = false;
        this.ganador = giro.targetName;
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Dibujar la ruleta en el canvas
   */
  private dibujarRuleta(): void {
    if (!this.ctx || !this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.nombres.length === 0) {
      // Dibujar círculo vacío
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#2a2832';
      ctx.fill();
      ctx.fillStyle = '#8a8794';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Sin nombres', centerX, centerY);
      return;
    }

    const anglePerSegment = (Math.PI * 2) / this.nombres.length;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((this.currentRotation * Math.PI) / 180);

    // Dibujar segmentos
    for (let i = 0; i < this.nombres.length; i++) {
      const startAngle = -Math.PI / 2 + i * anglePerSegment;
      const endAngle = startAngle + anglePerSegment;

      // Segmento
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = this.COLORS[i % this.COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Texto
      ctx.save();
      ctx.rotate(startAngle + anglePerSegment / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#0e0d12';
      ctx.font = 'bold 16px Arial';
      const nombre = this.nombres[i].length > 12 ? this.nombres[i].substring(0, 11) + '…' : this.nombres[i];
      ctx.fillText(nombre, radius - 20, 0);
      ctx.restore();
    }

    // Centro
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#15141a';
    ctx.fill();
    ctx.strokeStyle = '#d4a851';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }
}