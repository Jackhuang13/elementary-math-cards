/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SceneManager } from './SceneManager';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public sceneManager: SceneManager;

  public getVirtualWidth(): number {
    const cur = this.sceneManager.getCurrentScene();
    return cur?.virtualWidth ?? 400;
  }

  public getVirtualHeight(): number {
    const cur = this.sceneManager.getCurrentScene();
    return cur?.virtualHeight ?? 520;
  }

  public virtualWidth: number = 400;
  public virtualHeight: number = 520;

  // Actual canvas display dimensions in CSS pixels
  public clientWidth: number = 400;
  public clientHeight: number = 520;

  // Uniform scale to guarantee 1:1 pixel aspect ratio (no squishing/stretching)
  public scale: number = 1;
  public offsetX: number = 0;
  public offsetY: number = 0;

  private isRunning: boolean = false;
  private lastTime: number = 0;
  private animFrameId: number = 0;
  private resizeObserver: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = ctx;
    this.sceneManager = new SceneManager();

    this.bindEvents();
    this.resize();

    // Use ResizeObserver to auto-adapt whenever layout changes
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.resize();
      });
      if (this.canvas.parentElement) {
        this.resizeObserver.observe(this.canvas.parentElement);
      }
      this.resizeObserver.observe(this.canvas);
    }
  }

  public resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5); // Cap for performance

    this.clientWidth = rect.width;
    this.clientHeight = rect.height;

    // Buffer dimensions match CSS pixels exactly * dpr
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);

    const cur = this.sceneManager.getCurrentScene();
    let baseVw = 390;
    let minVh = 325;

    if (cur?.name === 'menu') {
      baseVw = 400;
      minVh = 600;
    } else if (cur?.name === 'result') {
      baseVw = 400;
      minVh = 560;
    }

    // Responsive World Coordinates: scale ensures minimum design bounds fit
    const scale = Math.min(rect.width / baseVw, rect.height / minVh);
    this.scale = scale;

    // World dimensions expand dynamically to match the viewport aspect ratio
    const vw = Math.round(rect.width / scale);
    const vh = Math.round(rect.height / scale);
    this.offsetX = 0;
    this.offsetY = 0;
    this.virtualWidth = vw;
    this.virtualHeight = vh;
  }

  private bindEvents(): void {
    const getPos = (e: MouseEvent | Touch): { x: number; y: number } => {
      const rect = this.canvas.getBoundingClientRect();
      const cssX = e.clientX - rect.x;
      const cssY = e.clientY - rect.y;

      // Map from CSS pixels into virtual world coordinates
      const virtualX = (cssX - this.offsetX) / this.scale;
      const virtualY = (cssY - this.offsetY) / this.scale;

      return { x: virtualX, y: virtualY };
    };

    // Pointer events
    this.canvas.addEventListener('pointerdown', (e) => {
      const pos = getPos(e);
      this.sceneManager.handlePointerDown(pos.x, pos.y);
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const pos = getPos(e);
      this.sceneManager.handlePointerMove(pos.x, pos.y);
    });

    this.canvas.addEventListener('pointerup', (e) => {
      const pos = getPos(e);
      this.sceneManager.handlePointerUp(pos.x, pos.y);
    });
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private loop = (time: number): void => {
    if (!this.isRunning) return;

    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    // Update
    this.sceneManager.update(dt);

    // Render with crisp dpr transform reset every frame
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.clearRect(0, 0, this.clientWidth, this.clientHeight);

    const cur = this.sceneManager.getCurrentScene();
    let baseVw = 390;
    let minVh = 325;

    if (cur?.name === 'menu') {
      baseVw = 400;
      minVh = 600;
    } else if (cur?.name === 'result') {
      baseVw = 400;
      minVh = 560;
    }

    const scale = Math.min(this.clientWidth / baseVw, this.clientHeight / minVh);
    this.scale = scale;
    const vw = Math.round(this.clientWidth / scale);
    const vh = Math.round(this.clientHeight / scale);
    this.offsetX = 0;
    this.offsetY = 0;
    this.virtualWidth = vw;
    this.virtualHeight = vh;

    this.ctx.save();
    // Apply virtual coordinate scale (0, 0 matches canvas top-left, vw, vh matches canvas bottom-right)
    this.ctx.scale(this.scale, this.scale);

    // Render active scene in responsive virtual world coords
    this.sceneManager.render(this.ctx, vw, vh);

    this.ctx.restore();

    this.animFrameId = requestAnimationFrame(this.loop);
  };
}
