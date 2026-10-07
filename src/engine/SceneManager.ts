/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scene } from './Scene';

export class SceneManager {
  private scenes: Map<string, Scene> = new Map();
  private currentScene: Scene | null = null;
  public onSceneChange?: (sceneName: string) => void;

  public registerScene(scene: Scene): void {
    scene.manager = this;
    this.scenes.set(scene.name, scene);
  }

  public getScene(name: string): Scene | undefined {
    return this.scenes.get(name);
  }

  public getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  public changeScene(name: string, data?: unknown): void {
    const nextScene = this.scenes.get(name);
    if (!nextScene) {
      console.error(`[SceneManager] Scene "${name}" not found.`);
      return;
    }

    if (this.currentScene) {
      this.currentScene.exit();
    }

    this.currentScene = nextScene;
    this.currentScene.enter(data);

    if (this.onSceneChange) {
      this.onSceneChange(name);
    }
  }

  public update(dt: number): void {
    if (this.currentScene) {
      this.currentScene.update(dt);
    }
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.currentScene) {
      this.currentScene.render(ctx, width, height);
    }
  }

  public handlePointerDown(x: number, y: number): boolean | void {
    if (this.currentScene) {
      return this.currentScene.onPointerDown(x, y);
    }
  }

  public handlePointerMove(x: number, y: number): void {
    if (this.currentScene) {
      this.currentScene.onPointerMove(x, y);
    }
  }

  public handlePointerUp(x: number, y: number): void {
    if (this.currentScene) {
      this.currentScene.onPointerUp(x, y);
    }
  }
}
