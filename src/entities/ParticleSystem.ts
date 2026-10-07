/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape: 'star' | 'circle' | 'text';
  text?: string;
  fontSize?: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  public emitFloatingText(x: number, y: number, text: string, color = '#f59e0b', fontSize = 22) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 10,
      vy: -55 - Math.random() * 20,
      size: fontSize,
      color,
      alpha: 1.0,
      decay: 0.9,
      shape: 'text',
      text,
      fontSize,
    });
  }

  public emitSparkles(x: number, y: number, count = 12, colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899']) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 1.2 + Math.random() * 0.8,
        shape: Math.random() > 0.5 ? 'star' : 'circle',
      });
    }
  }

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;

      if (p.shape !== 'text') {
        p.vy += 60 * dt; // gravity
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.shape === 'text' && p.text) {
        ctx.font = `bold ${p.fontSize || 20}px "Fredoka", "Noto Sans TC", sans-serif`;
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Gentle text shadow
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 4;
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.shape === 'star') {
        ctx.fillStyle = p.color;
        this.drawStar(ctx, p.x, p.y, 5, p.size, p.size / 2);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }
}
