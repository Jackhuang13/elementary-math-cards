/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scene } from '../engine/Scene';
import { CardProgress } from '../engine/types';
import { soundManager } from '../engine/SoundManager';
import confetti from 'canvas-confetti';

export class ResultScene extends Scene {
  public override readonly name = 'result';

  public override virtualWidth: number = 400;
  public override virtualHeight: number = 580;

  private progressData: CardProgress | null = null;
  private animTimer: number = 0;

  private restartBtnBounds = { x: 200, y: 440, width: 250, height: 44 };
  private menuBtnBounds = { x: 200, y: 500, width: 250, height: 40 };

  public override enter(data?: unknown): void {
    this.progressData = data as CardProgress;
    this.animTimer = 0;
    soundManager.playFanfare();

    // Fire confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
      });
    } catch {
      // Ignored
    }
  }

  public override update(dt: number): void {
    this.animTimer += dt;
  }

  public override render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.virtualWidth = width;
    this.virtualHeight = height;

    // Update dynamic button positions
    const btnW = Math.min(290, width - 64);
    const restartH = 46;
    const menuH = 40;
    const mbY = height - menuH / 2 - 24;
    const rbY = mbY - menuH / 2 - 14 - restartH / 2;

    this.restartBtnBounds = { x: width / 2, y: rbY, width: btnW, height: restartH };
    this.menuBtnBounds = { x: width / 2, y: mbY, width: btnW, height: menuH };

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.3, '#fefce8');
    grad.addColorStop(1, '#fef9c3');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 1. Trophy & Celebration Header
    this.drawTrophyHeader(ctx, width);

    // 2. Score & Stats Card
    this.drawStatsCard(ctx, width);

    // 3. Badges Awarded
    this.drawBadgesSection(ctx, width);

    // 4. Action Buttons
    this.drawActionButtons(ctx);
  }

  private drawTrophyHeader(ctx: CanvasRenderingContext2D, width: number) {
    ctx.save();
    const cx = width / 2;

    // Glowing circle
    ctx.beginPath();
    ctx.arc(cx, 44, 26, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '28px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆', cx, 44);

    // Title
    if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '1.5px';
    ctx.font = '900 22px "Bpmf Huninn", "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.fillText('冒險大成功！', cx, 84);

    ctx.font = 'bold 12px "Bpmf Huninn", "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#059669';
    ctx.fillText('🎉 你完成了 4 張直式小卡，太棒了！', cx, 106);

    ctx.restore();
  }

  private drawStatsCard(ctx: CanvasRenderingContext2D, width: number) {
    ctx.save();
    const cardX = 24;
    const cardY = 126;
    const cardW = width - 48;
    const cardH = 112;

    // Card background
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    this.roundRect(ctx, cardX, cardY, cardW, cardH, 16);
    ctx.fill();

    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, cardX, cardY, cardW, cardH, 16);
    ctx.stroke();

    // Stats Grid
    const totalTime = this.progressData
      ? Math.max(1, Math.round(((this.progressData.endTime || Date.now()) - this.progressData.startTime) / 1000))
      : 45;
    const mins = Math.floor(totalTime / 60);
    const secs = totalTime % 60;
    const timeFormatted = `${mins}分 ${secs}秒`;

    const totalStars = this.progressData?.stars ?? 12;

    const stats = [
      { label: '通關小卡', value: '4 / 4 張', icon: '📝' },
      { label: '挑戰時間', value: timeFormatted, icon: '⏱️' },
      { label: '獲得星星', value: `${totalStars} / 12 ⭐`, icon: '🌟' },
      { label: '冒險得分', value: `${this.progressData?.score ?? 400} 分`, icon: '🎯' },
    ];

    const colW = cardW / 2;
    stats.forEach((st, idx) => {
      const row = Math.floor(idx / 2);
      const col = idx % 2;
      const sx = cardX + col * colW + colW / 2;
      const sy = cardY + 24 + row * 44;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.font = 'bold 11px "Bpmf Huninn", "Noto Sans TC", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`${st.icon} ${st.label}`, sx, sy - 8);

      ctx.font = 'bold 14px "Fredoka", "Bpmf Huninn", "Noto Sans TC", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(st.value, sx, sy + 10);
    });

    ctx.restore();
  }

  private drawBadgesSection(ctx: CanvasRenderingContext2D, width: number) {
    ctx.save();
    ctx.font = 'bold 12px "Bpmf Huninn", "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.fillText('🎖️ 獲得榮譽勳章：', 28, 260);

    const mode = this.progressData?.mode || 'grand_master';
    let badges = [
      { title: '全能大師', desc: '4卡全通關', emoji: '👑', bg: '#f3e8ff', border: '#9333ea' },
      { title: '進位神算', desc: '滿十無失誤', emoji: '⚡', bg: '#fef3c7', border: '#f59e0b' },
      { title: '借位法師', desc: '借10好厲害', emoji: '🪄', bg: '#e0f2fe', border: '#0284c7' },
    ];

    if (mode === 'basic') {
      badges = [
        { title: '加減高手', desc: '運算一把罩', emoji: '🌱', bg: '#dcfce7', border: '#16a34a' },
        { title: '進位達人', desc: '進位超清楚', emoji: '⚡', bg: '#fef3c7', border: '#f59e0b' },
        { title: '借位幫手', desc: '借10很熟練', emoji: '🪄', bg: '#e0f2fe', border: '#0284c7' },
      ];
    } else if (mode === 'adv_carry' || mode === 'carry') {
      badges = [
        { title: '連續進位', desc: '個十位進1', emoji: '⚡', bg: '#fef3c7', border: '#f59e0b' },
        { title: '突破大師', desc: '算數飛快', emoji: '🔥', bg: '#fee2e2', border: '#ef4444' },
        { title: '守護之星', desc: '全都答對', emoji: '🌟', bg: '#fef9c3', border: '#eab308' },
      ];
    } else if (mode === 'adv_borrow' || mode === 'borrow') {
      badges = [
        { title: '借位王者', desc: '遇到0也不怕', emoji: '✨', bg: '#f3e8ff', border: '#9333ea' },
        { title: '退位專家', desc: '步驟很清晰', emoji: '🪄', bg: '#e0f2fe', border: '#0284c7' },
        { title: '闖關神童', desc: '克服難題', emoji: '🛡️', bg: '#ecfdf5', border: '#10b981' },
      ];
    }

    const itemW = (width - 48 - 12) / 3;
    badges.forEach((b, idx) => {
      const bx = 24 + idx * (itemW + 6);
      const by = 274;
      const bh = 106;

      ctx.fillStyle = b.bg;
      this.roundRect(ctx, bx, by, itemW, bh, 12);
      ctx.fill();

      ctx.strokeStyle = b.border;
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, bx, by, itemW, bh, 12);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '24px "Fredoka", sans-serif';
      ctx.fillText(b.emoji, bx + itemW / 2, by + 26);

      ctx.font = 'bold 12px "Bpmf Huninn", "Noto Sans TC", sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(b.title, bx + itemW / 2, by + 56);

      ctx.font = '10px "Bpmf Huninn", "Noto Sans TC", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(b.desc, bx + itemW / 2, by + 78);
    });

    ctx.restore();
  }

  private drawActionButtons(ctx: CanvasRenderingContext2D) {
    // 1. Restart Button
    const { x, y, width, height } = this.restartBtnBounds;
    ctx.save();
    ctx.translate(x, y);

    ctx.shadowColor = 'rgba(234, 88, 12, 0.35)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 3;

    const grad = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
    grad.addColorStop(0, '#f97316');
    grad.addColorStop(1, '#ea580c');
    ctx.fillStyle = grad;

    this.roundRect(ctx, -width / 2, -height / 2, width, height, height / 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.font = 'bold 16px "Bpmf Huninn", "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔄 再玩一次', 0, 0);
    ctx.restore();

    // 2. Return to Menu Button
    const mb = this.menuBtnBounds;
    ctx.save();
    ctx.translate(mb.x, mb.y);

    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, -mb.width / 2, -mb.height / 2, mb.width, mb.height, mb.height / 2);
    ctx.fill();

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, -mb.width / 2, -mb.height / 2, mb.width, mb.height, mb.height / 2);
    ctx.stroke();

    ctx.font = 'bold 14px "Bpmf Huninn", "Noto Sans TC", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏠 回主選單', 0, 0);
    ctx.restore();
  }

  public override onPointerDown(px: number, py: number): boolean | void {
    const rb = this.restartBtnBounds;
    if (
      px >= rb.x - rb.width / 2 &&
      px <= rb.x + rb.width / 2 &&
      py >= rb.y - rb.height / 2 &&
      py <= rb.y + rb.height / 2
    ) {
      soundManager.playPop();
      const currentMode = this.progressData?.mode || 'grand_master';
      const currentDigits = this.progressData?.digitCount || 3;
      this.manager.changeScene('game', { mode: currentMode, digitCount: currentDigits });
      return true;
    }

    const mb = this.menuBtnBounds;
    if (
      px >= mb.x - mb.width / 2 &&
      px <= mb.x + mb.width / 2 &&
      py >= mb.y - mb.height / 2 &&
      py <= mb.y + mb.height / 2
    ) {
      soundManager.playPop();
      this.manager.changeScene('menu');
      return true;
    }
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
