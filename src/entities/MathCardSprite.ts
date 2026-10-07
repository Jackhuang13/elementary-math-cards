/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatedSprite } from '../engine/AnimatedSprite';
import { MathProblem, ColumnData } from '../engine/types';
import { ParticleSystem } from './ParticleSystem';
import { soundManager } from '../engine/SoundManager';
import { animate } from 'animejs';

export interface CardCallbacks {
  onCarryToggled: (colIndex: number) => void;
  onBorrowToggled: (colIndex: number) => void;
  onColumnSelected: (colIndex: number) => void;
  onStepError: (message: string) => void;
}

export class MathCardSprite extends AnimatedSprite {
  public problem: MathProblem;
  public cardIndex: number; // 0..3
  public totalCards: number = 4;
  public particles: ParticleSystem;
  public callbacks: CardCallbacks;

  // Grid layout geometry relative to card center (0, 0)
  private colWidth: number = 68;
  private rowHeight: number = 50;
  private headerY: number = -125;
  private colHeaderY: number = -95;
  private carryRowY: number = -65;
  private digitARowY: number = -20;
  private digitBRowY: number = 28;
  private dividerY: number = 60;
  private answerRowY: number = 100;

  // Visual scratch animations progress per column (0 to 1)
  private scratchProgress: Map<number, number> = new Map();

  // Card completion stamp animation
  public isCompletedCelebration: boolean = false;
  private stampScale: number = 2.4;
  private stampAlpha: number = 0;
  private stampRotation: number = -0.2;

  // Slide transition state
  public slideOffsetX: number = 0;
  public slideOpacity: number = 1;

  constructor(
    x: number,
    y: number,
    problem: MathProblem,
    cardIndex: number,
    particles: ParticleSystem,
    callbacks: CardCallbacks
  ) {
    super(x, y, 380, 320);
    this.problem = problem;
    this.cardIndex = cardIndex;
    this.particles = particles;
    this.callbacks = callbacks;
    this.updateGeometry();
  }

  private updateGeometry() {
    const numCols = this.problem.columns.length;
    if (numCols <= 2) {
      this.colWidth = 76;
      this.width = 340;
    } else if (numCols === 3) {
      this.colWidth = 70;
      this.width = 380;
    } else {
      this.colWidth = 64;
      this.width = 404;
    }
    this.height = 320;
  }

  public getCarryRowY(): number {
    return this.carryRowY;
  }

  public getDigitARowY(): number {
    return this.digitARowY;
  }

  public getAnswerRowY(): number {
    return this.answerRowY;
  }

  public setProblem(problem: MathProblem, cardIndex: number) {
    this.problem = problem;
    this.cardIndex = cardIndex;
    this.updateGeometry();
    this.scratchProgress.clear();
    this.isCompletedCelebration = false;
    this.stampAlpha = 0;
    this.slideOffsetX = 0;
    this.slideOpacity = 1;
  }

  /**
   * Calculate column center X relative to card center
   * Columns are ordered from 0 (ones, rightmost) up to 2 or 3 (hundreds/thousands, leftmost)
   */
  public getColumnX(colIndex: number): number {
    const rightMargin = 38;
    const rightX = this.width / 2 - rightMargin - this.colWidth / 2;
    return rightX - colIndex * this.colWidth;
  }

  public override update(dt: number): void {
    super.update(dt);

    // Animate scratches
    for (const [colIdx, progress] of this.scratchProgress.entries()) {
      if (progress < 1) {
        this.scratchProgress.set(colIdx, Math.min(1, progress + dt * 4));
      }
    }

    // Animate completion stamp slam-down
    if (this.isCompletedCelebration) {
      if (this.stampScale > 1) {
        this.stampScale = Math.max(1, this.stampScale - dt * 6.5);
      }
      if (this.stampAlpha < 0.95) {
        this.stampAlpha = Math.min(0.95, this.stampAlpha + dt * 5.5);
      }
    }
  }

  public triggerCompletionStamp() {
    this.isCompletedCelebration = true;
    this.stampScale = 2.4;
    this.stampAlpha = 0;
    setTimeout(() => {
      soundManager.playStamp();
    }, 100);
  }

  public triggerSlideOut(onDone: () => void) {
    animate(this, {
      slideOffsetX: -450,
      slideOpacity: 0,
      duration: 320,
      ease: 'inQuad',
      onComplete: () => {
        onDone();
      },
    });
  }

  public triggerSlideIn() {
    this.isCompletedCelebration = false;
    this.stampAlpha = 0;
    this.slideOffsetX = 450;
    this.slideOpacity = 0;
    animate(this, {
      slideOffsetX: 0,
      slideOpacity: 1,
      duration: 400,
      ease: 'outBack(1.2)',
    });
  }

  public override render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.opacity <= 0 || this.slideOpacity <= 0) return;

    ctx.save();
    ctx.translate(this.x + this.slideOffsetX, this.y);
    if (this.rotation !== 0) ctx.rotate(this.rotation);
    if (this.scaleX !== 1 || this.scaleY !== 1) ctx.scale(this.scaleX, this.scaleY);
    ctx.globalAlpha = Math.max(0, Math.min(1, ctx.globalAlpha * this.opacity * this.slideOpacity));

    this.draw(ctx);

    ctx.restore();
  }

  public triggerScratchAnimation(colIdx: number) {
    this.scratchProgress.set(colIdx, 0.1);
  }

  public clearScratches(colIdx?: number) {
    if (colIdx !== undefined) {
      this.scratchProgress.delete(colIdx);
    } else {
      this.scratchProgress.clear();
    }
  }

  public handlePointerDown(localX: number, localY: number): boolean {
    const cols = this.problem.columns;

    // 1. Check Carry Buttons row (y around carryRowY)
    if (this.problem.type === 'add') {
      for (let i = 1; i < cols.length; i++) {
        const cx = this.getColumnX(i);
        const cy = this.carryRowY;
        const dist = Math.hypot(localX - cx, localY - cy);
        if (dist <= 26) {
          this.callbacks.onCarryToggled(i);
          return true;
        }
      }
    }

    // 2. Check Top Digit / Borrow click area (y from -70 to +10, covering digit A, scratch, and +10 bubble)
    if (this.problem.type === 'sub') {
      for (let i = 0; i < cols.length; i++) {
        const cx = this.getColumnX(i);
        if (Math.abs(localX - cx) <= 32 && localY >= this.digitARowY - 55 && localY <= this.digitARowY + 30) {
          this.callbacks.onBorrowToggled(i);
          return true;
        }
      }
    }

    // 3. Check Answer Boxes row (y around answerRowY)
    for (let i = 0; i < cols.length; i++) {
      const cx = this.getColumnX(i);
      const cy = this.answerRowY;
      if (Math.abs(localX - cx) <= 32 && Math.abs(localY - cy) <= 32) {
        this.callbacks.onColumnSelected(i);
        return true;
      }
    }

    return false;
  }

  protected override draw(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;
    const halfW = w / 2;
    const halfH = h / 2;

    // 1. Card Shadow & Background Paper
    ctx.save();
    ctx.shadowColor = 'rgba(120, 90, 40, 0.14)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;

    // Main Card
    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, -halfW, -halfH, w, h, 24);
    ctx.fill();
    ctx.restore();

    // Card border
    ctx.strokeStyle = '#f1e5d3';
    ctx.lineWidth = 3;
    this.roundRect(ctx, -halfW, -halfH, w, h, 24);
    ctx.stroke();

    // Subtle notebook graph grid pattern
    ctx.save();
    ctx.strokeStyle = '#fbf0e4';
    ctx.lineWidth = 1;
    const gridStep = 24;
    ctx.beginPath();
    for (let gx = -halfW + 16; gx < halfW - 16; gx += gridStep) {
      ctx.moveTo(gx, -halfH + 45);
      ctx.lineTo(gx, halfH - 20);
    }
    for (let gy = -halfH + 50; gy < halfH - 20; gy += gridStep) {
      ctx.moveTo(-halfW + 16, gy);
      ctx.lineTo(halfW - 16, gy);
    }
    ctx.stroke();
    ctx.restore();

    // 2. Card Header
    this.drawCardHeader(ctx, halfW, halfH);

    // 3. Column Headers (百位, 十位, 個位)
    this.drawColumnHeaders(ctx);

    // 4. Carry Row (加法專用)
    if (this.problem.type === 'add') {
      this.drawCarryRow(ctx);
    }

    // 5. Operand Rows (Digit A, Operator, Digit B)
    this.drawOperandRows(ctx);

    // 6. Horizontal Dividing Equal Line
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-halfW + 36, this.dividerY);
    ctx.lineTo(halfW - 36, this.dividerY);
    ctx.stroke();
    ctx.restore();

    // 7. Answer Row
    this.drawAnswerRow(ctx);

    // 8. Teacher reward praise stamp on card completion
    if (this.isCompletedCelebration && this.stampAlpha > 0) {
      this.drawPraiseStamp(ctx);
    }
  }

  private drawPraiseStamp(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(52, -10);
    ctx.rotate(this.stampRotation);
    ctx.scale(this.stampScale, this.stampScale);
    ctx.globalAlpha = Math.min(1, ctx.globalAlpha * this.stampAlpha);

    const stampR = 46;

    // Stamp subtle shadow / ink bleed
    ctx.shadowColor = 'rgba(225, 29, 72, 0.25)';
    ctx.shadowBlur = 6;

    // Outer double ring stamp
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, stampR, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, stampR - 6, 0, Math.PI * 2);
    ctx.stroke();

    // Stamp text
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#e11d48';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '900 13px "Noto Sans TC", sans-serif';
    ctx.fillText('★ 算術大師 ★', 0, -20);

    ctx.font = '900 24px "Fredoka", "Noto Sans TC", sans-serif';
    ctx.fillText('100', 0, 1);

    ctx.font = 'bold 12px "Noto Sans TC", sans-serif';
    ctx.fillText('太棒了！', 0, 22);

    ctx.restore();
  }

  private drawCardHeader(ctx: CanvasRenderingContext2D, halfW: number, halfH: number) {
    ctx.save();

    // Top paper clip decoration
    ctx.fillStyle = '#f59e0b';
    this.roundRect(ctx, -22, -halfH - 8, 44, 16, 8);
    ctx.fill();

    // Card Progress Tag
    ctx.font = 'bold 15px "Fredoka", "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`第 ${this.cardIndex + 1} / ${this.totalCards} 卡`, -halfW + 28, this.headerY);

    // Difficulty / Type Tag
    ctx.textAlign = 'right';
    const tagBg = this.problem.type === 'add' ? '#fef3c7' : '#e0f2fe';
    const tagColor = this.problem.type === 'add' ? '#b45309' : '#0369a1';

    const tagText = this.problem.difficultyTag;
    ctx.font = 'bold 13px "Noto Sans TC", sans-serif';
    const textWidth = ctx.measureText(tagText).width;

    ctx.fillStyle = tagBg;
    this.roundRect(ctx, halfW - 28 - textWidth - 16, this.headerY - 12, textWidth + 16, 24, 12);
    ctx.fill();

    ctx.fillStyle = tagColor;
    ctx.fillText(tagText, halfW - 28 - 8, this.headerY);

    ctx.restore();
  }

  private drawColumnHeaders(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.font = '600 13px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const headerY = this.colHeaderY;

    for (let i = 0; i < this.problem.columns.length; i++) {
      const col = this.problem.columns[i];
      const cx = this.getColumnX(i);

      const isActive = i === this.problem.activeColumnIndex;
      ctx.fillStyle = isActive ? '#0284c7' : '#94a3b8';
      ctx.fillText(col.placeName, cx, headerY);

      // Light column dividing guide
      ctx.strokeStyle = isActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(226, 232, 240, 0.6)';
      ctx.lineWidth = isActive ? 1.5 : 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - this.colWidth / 2, this.colHeaderY - 12);
      ctx.lineTo(cx - this.colWidth / 2, this.answerRowY + 34);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  private drawCarryRow(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const cols = this.problem.columns;

    // Carry can only be received by columns higher than ones (index >= 1)
    for (let i = 1; i < cols.length; i++) {
      const col = cols[i];
      const cx = this.getColumnX(i);
      const cy = this.carryRowY;

      // Does this column have or expect carry-in from lower column?
      const expectsCarry = col.requiresCarryIn;
      const isMarked = col.userCarryMarked;
      // Prompt carry at column i if the column to the right (i - 1) is currently active and produces a carry
      const isPromptedByLower = (this.problem.activeColumnIndex === i - 1 && cols[i - 1].producesCarryOut);

      // Draw Carry interactive slot
      if (expectsCarry || isMarked || isPromptedByLower) {
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);

        if (isMarked) {
          // Marked carry: glowing golden circle
          ctx.fillStyle = '#fbbf24';
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.font = 'bold 16px "Fredoka", sans-serif';
          ctx.fillStyle = '#78350f';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('+1', cx, cy);
        } else {
          // Unmarked but needed: pulsing prompt
          ctx.fillStyle = '#fef3c7';
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.font = 'bold 12px "Noto Sans TC", sans-serif';
          ctx.fillStyle = '#d97706';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('＋1?', cx, cy);
        }
      }
    }
    ctx.restore();
  }

  private drawOperandRows(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const cols = this.problem.columns;

    // Operator symbol ('+' or '-')
    const opX = -this.width / 2 + 54;
    const opY = this.digitBRowY;
    ctx.font = 'bold 36px "Fredoka", sans-serif';
    ctx.fillStyle = this.problem.type === 'add' ? '#ea580c' : '#0284c7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.problem.type === 'add' ? '+' : '−', opX, opY);

    ctx.font = 'bold 34px "Fredoka", "Noto Sans TC", sans-serif';

    // Digits
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      const cx = this.getColumnX(i);

      // Overflow carry columns (e.g. hundreds in 65 + 98 = 163) have NO operand addends
      const isColOverflow = Boolean(
        col.isOverflowColumn ||
        (col.placePower >= this.problem.digitCount && col.digitA === 0 && col.digitB === 0)
      );

      // Top Operand A
      if (!isColOverflow) {
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(col.digitA), cx, this.digitARowY);

        // Subtraction Borrow Effects
        if (this.problem.type === 'sub') {
          // If borrowed from: scratch line and replacement number!
          if (col.userBorrowCrossed) {
            // Scratch Red Line
            ctx.save();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            const progress = this.scratchProgress.get(i) ?? 1;

            ctx.beginPath();
            const slashLen = 32 * progress;
            ctx.moveTo(cx - 16, this.digitARowY + 16);
            ctx.lineTo(cx - 16 + slashLen, this.digitARowY + 16 - slashLen);
            ctx.stroke();
            ctx.restore();

            // Modified Digit written above
            if (col.modifiedDigitA !== undefined) {
              ctx.save();
              ctx.font = 'bold 18px "Fredoka", sans-serif';
              ctx.fillStyle = '#dc2626';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(String(col.modifiedDigitA), cx, this.digitARowY - 26);
              ctx.restore();
            }
          }

          // If this column received borrowed +10 (and has not given it away to a lower column)
          if (col.userReceivedBorrow && !col.userBorrowCrossed) {
            ctx.save();
            ctx.fillStyle = '#0284c7';
            this.roundRect(ctx, cx - 18, this.digitARowY - 48, 36, 22, 11);
            ctx.fill();

            ctx.font = 'bold 13px "Fredoka", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+10', cx, this.digitARowY - 37);
            ctx.restore();
          }
        }
      }

      // Bottom Operand B
      if (!isColOverflow) {
        ctx.fillStyle = '#334155';
        ctx.fillText(String(col.digitB), cx, this.digitBRowY);
      }
    }

    ctx.restore();
  }

  private drawAnswerRow(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const cols = this.problem.columns;
    const activeIdx = this.problem.activeColumnIndex;

    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      const cx = this.getColumnX(i);
      const cy = this.answerRowY;
      const isActive = i === activeIdx;

      // Answer Box container
      ctx.save();
      const boxW = 54;
      const boxH = 58;

      if (isActive) {
        // Glowing active border
        ctx.shadowColor = 'rgba(14, 165, 233, 0.45)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#f0f9ff';
        this.roundRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 14);
        ctx.fill();

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3;
        this.roundRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 14);
        ctx.stroke();
      } else if (col.isCompleted) {
        // Completed column
        ctx.fillStyle = '#f0fdf4';
        this.roundRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 14);
        ctx.fill();

        ctx.strokeStyle = '#86efac';
        ctx.lineWidth = 2;
        this.roundRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 14);
        ctx.stroke();
      } else {
        // Inactive column
        ctx.fillStyle = '#f8fafc';
        this.roundRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 14);
        ctx.fill();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 14);
        ctx.stroke();
      }
      ctx.restore();

      // Answer Digit text
      ctx.font = 'bold 36px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (col.userAnswerDigit !== '') {
        ctx.fillStyle = col.isCompleted ? '#16a34a' : '#0f172a';
        ctx.fillText(col.userAnswerDigit, cx, cy);
      } else if (isActive) {
        // Blinking / pulsating cursor line or dot
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(cx - 8, cy + 14, 16, 3);
      }
    }

    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
