/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scene } from '../engine/Scene';
import { GameMode, DigitCount } from '../engine/types';
import { soundManager } from '../engine/SoundManager';

export class MenuScene extends Scene {
  public override readonly name = 'menu';

  public override virtualWidth: number = 420;
  public override virtualHeight: number = 650;

  public selectedMode: GameMode = 'grand_master';
  public selectedDigitCount: DigitCount = 3;
  private pulseTimer: number = 0;

  // Digit selection tabs
  private digitTabs = [
    { count: 2 as DigitCount, label: '二位數', sub: '個~十位' },
    { count: 3 as DigitCount, label: '三位數', sub: '個~百位' },
    { count: 4 as DigitCount, label: '四位數', sub: '個~千位' },
  ];

  // Mode cards
  private modeButtons = [
    {
      mode: 'basic' as GameMode,
      title: '🌱 普通直式加減法',
      subtitle: '單次進位與借位 · 扎實數學基底',
      tag: '基礎必練',
      tagBg: '#dcfce7',
      tagColor: '#15803d',
    },
    {
      mode: 'adv_carry' as GameMode,
      title: '⚡ 進階連續進位加法',
      subtitle: '連續滿十進位 · 專攻個位十位連續進 1',
      tag: '連續進位',
      tagBg: '#fef3c7',
      tagColor: '#b45309',
    },
    {
      mode: 'adv_borrow' as GameMode,
      title: '💧 進階連續借位減法',
      subtitle: '連續退位專攻 · 熟練步步向高位借位',
      tag: '連續借位',
      tagBg: '#e0f2fe',
      tagColor: '#0369a1',
    },
    {
      mode: 'borrow' as GameMode,
      title: '👑 遇 0 跨位連續借位',
      subtitle: '遇 0 大魔王 · 跨位借 10 再借給隔壁',
      tag: '大魔王關',
      tagBg: '#fee2e2',
      tagColor: '#b91c1c',
    },
    {
      mode: 'grand_master' as GameMode,
      title: '🎲 全能階梯綜合闖關',
      subtitle: '4 張漸進小卡 · 單次進退 ➔ 連續進退',
      tag: '綜合推薦',
      tagBg: '#f3e8ff',
      tagColor: '#7e22ce',
    },
  ];

  public override enter(): void {
    this.pulseTimer = 0;
  }

  public override update(dt: number): void {
    this.pulseTimer += dt;
  }

  private getLayout(width: number, height: number) {
    const headerH = Math.min(118, Math.max(82, height * 0.14));
    const badgeR = Math.min(27, Math.max(20, headerH * 0.25));
    const badgeY = badgeR + 10;
    const titleY = badgeY + badgeR + 14;

    const titleFontSize = Math.min(25, Math.max(20, width * 0.055));
    const subFontSize = Math.min(13, Math.max(11, width * 0.03));

    const digitLabelY = headerH + 6;
    const digitStartY = digitLabelY + 16;
    const tabH = Math.min(56, Math.max(44, height * 0.072));
    const tabW = (width - 44 - 12) / 3;
    const tabLabelSize = Math.min(16, Math.max(13.5, width * 0.038));
    const tabSubSize = Math.min(11.5, Math.max(10, width * 0.026));

    const startBtnH = Math.min(62, Math.max(48, height * 0.082));
    const startBtnMarginBottom = Math.min(24, Math.max(14, height * 0.028));
    const startBtnY = height - startBtnH / 2 - startBtnMarginBottom;
    const startBtnW = Math.min(360, width - 44);
    const startBtnFontSize = Math.min(20, Math.max(17, width * 0.046));

    const modeLabelY = digitStartY + tabH + Math.min(20, Math.max(12, height * 0.022));
    const modeStartYRaw = modeLabelY + 16;
    const modeAvailH = Math.max(240, startBtnY - startBtnH / 2 - 14 - modeStartYRaw);

    const itemH = Math.min(72, Math.max(46, (modeAvailH - 24) / 5));
    const itemGap = Math.min(12, Math.max(6, (modeAvailH - itemH * 5) / 4));

    const totalModesH = itemH * 5 + itemGap * 4;
    const extraModeSpace = Math.max(0, modeAvailH - totalModesH);
    const modeStartY = modeStartYRaw + extraModeSpace * 0.35;

    const btnX = Math.max(18, Math.min(24, width * 0.05));
    const btnW = width - btnX * 2;
    const modeTitleFontSize = Math.min(16, Math.max(13.5, width * 0.038));
    const modeSubFontSize = Math.min(12, Math.max(10.5, width * 0.028));
    const modeTagFontSize = Math.min(11, Math.max(9.5, width * 0.026));
    const tagH = Math.min(22, Math.max(18, itemH * 0.32));

    return {
      headerH,
      badgeR,
      badgeY,
      titleY,
      titleFontSize,
      subFontSize,
      digitLabelY,
      digitStartY,
      tabH,
      tabW,
      tabLabelSize,
      tabSubSize,
      modeLabelY,
      modeStartY,
      itemH,
      itemGap,
      btnX,
      btnW,
      modeTitleFontSize,
      modeSubFontSize,
      modeTagFontSize,
      tagH,
      startBtnH,
      startBtnY,
      startBtnW,
      startBtnFontSize,
    };
  }

  public override render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.virtualWidth = width;
    this.virtualHeight = height;

    const layout = this.getLayout(width, height);

    // 1. Warm school desk gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#fef9c3');
    grad.addColorStop(0.35, '#fffbeb');
    grad.addColorStop(1, '#fef3c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle background math doodle symbols
    this.drawBackgroundDoodles(ctx, width, height);

    // 2. Title & Mascot Banner
    this.drawTitleBanner(ctx, width, layout);

    // 3. Digit Range Selection (二位數 / 三位數 / 四位數)
    this.drawDigitSelector(ctx, width, layout);

    // 4. Mode Selection Buttons
    this.drawModeSelector(ctx, layout);

    // 5. Big Start Adventure Button
    this.drawStartButton(ctx, width, layout);
  }

  private drawBackgroundDoodles(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(217, 119, 6, 0.07)';
    ctx.font = 'bold 30px "Fredoka", sans-serif';
    ctx.fillText('+', 18, 55);
    ctx.fillText('−', width - 36, 65);
    ctx.fillText('10', width - 46, height - 75);
    ctx.fillText('+1', 22, height - 65);
    ctx.fillText('=', width / 2 + 130, 45);
    ctx.restore();
  }

  private drawTitleBanner(
    ctx: CanvasRenderingContext2D,
    width: number,
    layout: ReturnType<typeof this.getLayout>
  ) {
    ctx.save();
    const cx = width / 2;

    // Mascot badge
    ctx.beginPath();
    ctx.arc(cx, layout.badgeY, layout.badgeR, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(180, 83, 9, 0.18)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    ctx.fill();

    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = `${Math.round(layout.badgeR * 1.25)}px "Fredoka", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📐', cx, layout.badgeY);

    // Main Title
    ctx.shadowColor = 'transparent';
    ctx.font = `900 ${layout.titleFontSize}px "Noto Sans TC", "Fredoka", sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.fillText('國小直式數學小卡冒險', cx, layout.titleY);

    // Subtitle
    ctx.font = `600 ${layout.subFontSize}px "Noto Sans TC", sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.fillText('自由填寫 · 自由進借位 · 三星素養評量', cx, layout.titleY + 19);

    ctx.restore();
  }

  private drawDigitSelector(
    ctx: CanvasRenderingContext2D,
    width: number,
    layout: ReturnType<typeof this.getLayout>
  ) {
    ctx.save();
    ctx.font = `bold ${layout.modeTitleFontSize}px "Noto Sans TC", sans-serif`;
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'left';
    ctx.fillText('1. 選擇數字位數：', 22, layout.digitLabelY);

    const { tabW, tabH, digitStartY } = layout;

    for (let i = 0; i < this.digitTabs.length; i++) {
      const tab = this.digitTabs[i];
      const isSelected = this.selectedDigitCount === tab.count;
      const tabX = 22 + i * (tabW + 6);

      ctx.save();
      if (isSelected) {
        // Selected Tab (Warm orange gradient)
        const tabGrad = ctx.createLinearGradient(0, digitStartY, 0, digitStartY + tabH);
        tabGrad.addColorStop(0, '#f97316');
        tabGrad.addColorStop(1, '#ea580c');
        ctx.fillStyle = tabGrad;
        ctx.shadowColor = 'rgba(234, 88, 12, 0.35)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 2;
        this.roundRect(ctx, tabX, digitStartY, tabW, tabH, 12);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${layout.tabLabelSize}px "Noto Sans TC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tab.label, tabX + tabW / 2, digitStartY + tabH * 0.38);

        ctx.font = `bold ${layout.tabSubSize}px "Noto Sans TC", sans-serif`;
        ctx.fillStyle = '#ffedd5';
        ctx.fillText(tab.sub, tabX + tabW / 2, digitStartY + tabH * 0.72);
      } else {
        // Unselected Tab
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.04)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 1;
        this.roundRect(ctx, tabX, digitStartY, tabW, tabH, 12);
        ctx.fill();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.2;
        this.roundRect(ctx, tabX, digitStartY, tabW, tabH, 12);
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.font = `bold ${layout.tabLabelSize}px "Noto Sans TC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tab.label, tabX + tabW / 2, digitStartY + tabH * 0.38);

        ctx.font = `500 ${layout.tabSubSize}px "Noto Sans TC", sans-serif`;
        ctx.fillStyle = '#64748b';
        ctx.fillText(tab.sub, tabX + tabW / 2, digitStartY + tabH * 0.72);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  private drawModeSelector(
    ctx: CanvasRenderingContext2D,
    layout: ReturnType<typeof this.getLayout>
  ) {
    ctx.save();
    ctx.font = `bold ${layout.modeTitleFontSize}px "Noto Sans TC", sans-serif`;
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'left';
    ctx.fillText('2. 選擇關卡模式：', 22, layout.modeLabelY);

    const { btnX, btnW, itemH, itemGap, modeStartY } = layout;

    for (let i = 0; i < this.modeButtons.length; i++) {
      const item = this.modeButtons[i];
      const isSelected = this.selectedMode === item.mode;
      const btnY = modeStartY + i * (itemH + itemGap);

      ctx.save();
      if (isSelected) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(234, 88, 12, 0.22)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 2;
        this.roundRect(ctx, btnX, btnY, btnW, itemH, 14);
        ctx.fill();

        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2.8;
        this.roundRect(ctx, btnX, btnY, btnW, itemH, 14);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.03)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 1;
        this.roundRect(ctx, btnX, btnY, btnW, itemH, 14);
        ctx.fill();

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.2;
        this.roundRect(ctx, btnX, btnY, btnW, itemH, 14);
        ctx.stroke();
      }

      // Radio indicator circle
      const dotX = btnX + 18;
      const dotY = btnY + itemH / 2;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#ea580c' : '#cbd5e1';
      ctx.fill();

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      // Title
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${layout.modeTitleFontSize}px "Noto Sans TC", sans-serif`;
      ctx.fillStyle = isSelected ? '#0f172a' : '#334155';
      ctx.fillText(item.title, btnX + 34, btnY + itemH * 0.36);

      // Subtitle
      ctx.font = `500 ${layout.modeSubFontSize}px "Noto Sans TC", sans-serif`;
      ctx.fillStyle = isSelected ? '#b45309' : '#64748b';
      ctx.fillText(item.subtitle, btnX + 34, btnY + itemH * 0.72);

      // Badge on right
      ctx.font = `bold ${layout.modeTagFontSize}px "Noto Sans TC", sans-serif`;
      const tagTextW = ctx.measureText(item.tag).width;
      const tagW = tagTextW + 14;
      const tagX = btnX + btnW - tagW - 12;
      const tagY = btnY + (itemH - layout.tagH) / 2;

      ctx.fillStyle = item.tagBg;
      this.roundRect(ctx, tagX, tagY, tagW, layout.tagH, layout.tagH / 2);
      ctx.fill();

      ctx.fillStyle = item.tagColor;
      ctx.textAlign = 'center';
      ctx.fillText(item.tag, tagX + tagW / 2, tagY + layout.tagH / 2 + 1);

      ctx.restore();
    }

    ctx.restore();
  }

  private drawStartButton(
    ctx: CanvasRenderingContext2D,
    width: number,
    layout: ReturnType<typeof this.getLayout>
  ) {
    const { startBtnW, startBtnH, startBtnY, startBtnFontSize } = layout;
    const pulseScale = 1 + Math.sin(this.pulseTimer * 4) * 0.02;

    ctx.save();
    ctx.translate(width / 2, startBtnY);
    ctx.scale(pulseScale, pulseScale);

    ctx.shadowColor = 'rgba(234, 88, 12, 0.45)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;

    const grad = ctx.createLinearGradient(0, -startBtnH / 2, 0, startBtnH / 2);
    grad.addColorStop(0, '#f97316');
    grad.addColorStop(1, '#ea580c');
    ctx.fillStyle = grad;

    this.roundRect(ctx, -startBtnW / 2, -startBtnH / 2, startBtnW, startBtnH, startBtnH / 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.font = `bold ${startBtnFontSize}px "Noto Sans TC", "Fredoka", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚀 開始 4 卡數學冒險', 0, 0);

    ctx.restore();
  }

  public override onPointerDown(px: number, py: number): boolean | void {
    const width = this.virtualWidth;
    const height = this.virtualHeight;
    const layout = this.getLayout(width, height);

    // 1. Check digit tabs (Generous touch area: startY - 8 .. startY + tabH + 8)
    if (py >= layout.digitStartY - 8 && py <= layout.digitStartY + layout.tabH + 8) {
      for (let i = 0; i < this.digitTabs.length; i++) {
        const tabX = 22 + i * (layout.tabW + 6);
        if (px >= tabX - 4 && px <= tabX + layout.tabW + 4) {
          this.selectedDigitCount = this.digitTabs[i].count;
          soundManager.playPop();
          return true;
        }
      }
    }

    // 2. Check mode buttons
    for (let i = 0; i < this.modeButtons.length; i++) {
      const btnY = layout.modeStartY + i * (layout.itemH + layout.itemGap);
      if (
        px >= layout.btnX - 8 &&
        px <= layout.btnX + layout.btnW + 8 &&
        py >= btnY - 4 &&
        py <= btnY + layout.itemH + 4
      ) {
        this.selectedMode = this.modeButtons[i].mode;
        soundManager.playPop();
        return true;
      }
    }

    // 3. Check Start button
    if (
      px >= width / 2 - layout.startBtnW / 2 - 16 &&
      px <= width / 2 + layout.startBtnW / 2 + 16 &&
      py >= layout.startBtnY - layout.startBtnH / 2 - 12 &&
      py <= layout.startBtnY + layout.startBtnH / 2 + 12
    ) {
      soundManager.playPop();
      this.manager.changeScene('game', {
        mode: this.selectedMode,
        digitCount: this.selectedDigitCount,
      });
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
