import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

type ShapeType = 'square' | 'circle' | 'triangle';

@Component({
  standalone: true,
  selector: 'app-cut-grid-canvas',
  template: `
    <div class="wrap">
      <canvas #canvas></canvas>
    </div>
  `,
  styles: [
    `
      .wrap {
        width: 100%;
        display: flex;
        justify-content: center;
      }
      canvas {
        width: 100%;
        max-width: 420px;
        display: block;
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 8px 24px rgba(65, 88, 208, 0.16);
      }
    `,
  ],
})
export class CutGridCanvasComponent implements AfterViewInit, OnChanges {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() colors: string[] = [];
  @Input() shape: ShapeType = 'square';
  @Input() columns = 4;
  @Input() rows = 4;
  @Input() elementSize = 48;
  @Input() spacing = 10;
  @Input() enableShadow = true;
  @Input() shadowBlur = 8;
  @Input() shadowOffsetY = 4;
  @Input() shadowOpacity = 35;
  @Input() rotation = 0;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(_: SimpleChanges): void {
    this.render();
  }

  getCanvas(): HTMLCanvasElement | null {
    return this.canvasRef?.nativeElement ?? null;
  }

  toDataURL(type = 'image/png'): string {
    return this.canvasRef.nativeElement.toDataURL(type);
  }

  private render(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const cols = Math.max(1, this.columns);
    const rows = Math.max(1, this.rows);
    const size = this.elementSize;
    const gap = this.spacing;
    const width = cols * size + (cols + 1) * gap;
    const height = rows * size + (rows + 1) * gap;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const colors = this.colors.length ? this.colors : ['#667eea'];
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (idx >= colors.length) {
          break;
        }
        const x = gap + c * (size + gap);
        const y = gap + r * (size + gap);
        const color = colors[idx++];
        ctx.save();
        if (this.enableShadow) {
          ctx.shadowBlur = this.shadowBlur;
          ctx.shadowOffsetY = this.shadowOffsetY;
          ctx.shadowColor = `rgba(0,0,0,${this.shadowOpacity / 100})`;
        }
        ctx.translate(x + size / 2, y + size / 2);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = color;
        this.drawShape(ctx, size);
        ctx.restore();
      }
    }
  }

  private drawShape(ctx: CanvasRenderingContext2D, size: number): void {
    const half = size / 2;
    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, half, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (this.shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(0, -half);
      ctx.lineTo(half, half);
      ctx.lineTo(-half, half);
      ctx.closePath();
      ctx.fill();
      return;
    }
    ctx.fillRect(-half, -half, size, size);
  }
}
