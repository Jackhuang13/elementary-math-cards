/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SceneManager } from './SceneManager';

export abstract class Scene {
  public abstract readonly name: string;
  public manager!: SceneManager;

  public virtualWidth: number = 400;
  public virtualHeight: number = 520;

  public enter(data?: unknown): void {}
  public exit(): void {}

  public abstract update(dt: number): void;
  public abstract render(ctx: CanvasRenderingContext2D, width: number, height: number): void;

  public onPointerDown(x: number, y: number): boolean | void {}
  public onPointerMove(x: number, y: number): void {}
  public onPointerUp(x: number, y: number): void {}
}
