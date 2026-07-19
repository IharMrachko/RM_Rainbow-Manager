import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-circular-mask-canvas',
  template: `<canvas #canvas class="mask-canvas"></canvas>`,
  styles: [
    `
      .mask-canvas {
        width: min(100%, 360px);
        height: 360px;
        display: block;
        margin: 0 auto;
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(65, 88, 208, 0.25);
      }
    `,
  ],
})
export class CircularMaskCanvasComponent implements OnChanges {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() image: HTMLImageElement | null = null;
  @Input() segments: { color: string }[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['image'] || changes['segments']) {
      setTimeout(() => this.draw(), 0);
    }
  }

  private draw(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const size = 360;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 8;
    const innerR = outerR - 42;

    // photo clipped to inner circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, size, size);
    if (this.image) {
      const img = this.image;
      const scale = Math.max((innerR * 2) / img.naturalWidth, (innerR * 2) / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    }
    ctx.restore();

    // segmented ring
    const segs = this.segments.length ? this.segments : [{ color: '#667eea' }];
    const step = (Math.PI * 2) / segs.length;
    segs.forEach((seg, i) => {
      const start = -Math.PI / 2 + i * step;
      const end = start + step;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, start, end);
      ctx.arc(cx, cy, innerR, end, start, true);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  toBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.canvasRef.nativeElement.toBlob((b) => resolve(b), 'image/png');
    });
  }
}
