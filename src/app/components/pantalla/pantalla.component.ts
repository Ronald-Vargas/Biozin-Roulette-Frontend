import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GiroResponse, RouletteService } from '../../services/roulette';

@Component({
  selector: 'app-pantalla',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pantalla.component.html',
  styleUrls: ['./pantalla.component.scss']
})

export class PantallaComponent implements OnInit, OnDestroy, AfterViewInit {
  
  @ViewChild('wheelCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  nombres: string[] = [];
  ganador: string = '';
  mostrarGanador: boolean = false;
  
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
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    this.dibujarRuleta();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Ejecutar la animación del giro
   */
  private ejecutarGiro(giro: GiroResponse): void {
    this.mostrarGanador = false;
    this.ganador = '';
    
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
        // Mostrar ganador después del giro
        this.ganador = giro.targetName;
        setTimeout(() => {
          this.mostrarGanador = true;
        }, 300);
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
      ctx.font = 'bold 18px Arial';
      const nombre = this.nombres[i].length > 12 ? this.nombres[i].substring(0, 11) + '…' : this.nombres[i];
      ctx.fillText(nombre, radius - 20, 0);
      ctx.restore();
    }

    // Centro
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#15141a';
    ctx.fill();
    ctx.strokeStyle = '#d4a851';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();
  }
}