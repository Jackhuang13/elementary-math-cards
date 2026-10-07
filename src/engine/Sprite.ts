/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class Sprite {
  public x: number = 0;
  public y: number = 0;
  public width: number = 0;
  public height: number = 0;
  public scaleX: number = 1;
  public scaleY: number = 1;
  public rotation: number = 0; // in radians
  public opacity: number = 1;
  public visible: boolean = true;
  public interactive: boolean = true;
  public zIndex: number = 0;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  public hitTest(px: number, py: number): boolean {
    if (!this.visible || !this.interactive) return false;
    const halfW = (this.width * Math.abs(this.scaleX)) / 2;
    const halfH = (this.height * Math.abs(this.scaleY)) / 2;
    return (
      px >= this.x - halfW &&
      px <= this.x + halfW &&
      py >= this.y - halfH &&
      py <= this.y + halfH
    );
  }

  public update(dt: number): void {
    // Override in subclasses
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.opacity <= 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.rotation !== 0) ctx.rotate(this.rotation);
    if (this.scaleX !== 1 || this.scaleY !== 1) ctx.scale(this.scaleX, this.scaleY);
    ctx.globalAlpha = Math.max(0, Math.min(1, ctx.globalAlpha * this.opacity));

    this.draw(ctx);

    ctx.restore();
  }

  /**
   * Internal drawing routine relative to (0, 0)
   */
  protected draw(ctx: CanvasRenderingContext2D): void {
    // Default debug box or empty
  }
}
