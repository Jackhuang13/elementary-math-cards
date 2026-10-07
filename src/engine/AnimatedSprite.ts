/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sprite } from './Sprite';

export class AnimatedSprite extends Sprite {
  // Shake effect state
  private isShaking: boolean = false;
  private shakeDuration: number = 0;
  private shakeTimer: number = 0;
  private shakeMagnitude: number = 0;
  private originX: number = 0;
  private originY: number = 0;

  // Pulse effect state
  private isPulsing: boolean = false;
  private pulseSpeed: number = 3;
  private pulseAmplitude: number = 0.08;
  private pulseTime: number = 0;

  // Float & fade state
  private isFloating: boolean = false;
  private floatVy: number = 0;
  private floatDuration: number = 0;
  private floatTimer: number = 0;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    super(x, y, width, height);
    this.originX = x;
    this.originY = y;
  }

  public setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.originX = x;
    this.originY = y;
  }

  /**
   * Starts a lateral shake animation (for error feedback)
   */
  public triggerShake(magnitude = 10, duration = 0.45) {
    this.isShaking = true;
    this.shakeMagnitude = magnitude;
    this.shakeDuration = duration;
    this.shakeTimer = 0;
  }

  /**
   * Starts a subtle breathing/pulse loop
   */
  public setPulsing(enabled: boolean, amplitude = 0.08, speed = 3) {
    this.isPulsing = enabled;
    this.pulseAmplitude = amplitude;
    this.pulseSpeed = speed;
    if (!enabled) {
      this.scaleX = 1;
      this.scaleY = 1;
    }
  }

  /**
   * Triggers a float-up and fade-out animation
   */
  public triggerFloat(vy = -60, duration = 0.8) {
    this.isFloating = true;
    this.floatVy = vy;
    this.floatDuration = duration;
    this.floatTimer = 0;
  }

  public override update(dt: number): void {
    super.update(dt);

    // Shake logic
    if (this.isShaking) {
      this.shakeTimer += dt;
      if (this.shakeTimer >= this.shakeDuration) {
        this.isShaking = false;
        this.x = this.originX;
      } else {
        const decay = 1 - this.shakeTimer / this.shakeDuration;
        const currentMag = this.shakeMagnitude * decay;
        this.x = this.originX + Math.sin(this.shakeTimer * 40) * currentMag;
      }
    }

    // Pulse logic
    if (this.isPulsing) {
      this.pulseTime += dt;
      const s = 1 + Math.sin(this.pulseTime * this.pulseSpeed) * this.pulseAmplitude;
      this.scaleX = s;
      this.scaleY = s;
    }

    // Float logic
    if (this.isFloating) {
      this.floatTimer += dt;
      this.y += this.floatVy * dt;
      const progress = this.floatTimer / this.floatDuration;
      this.opacity = Math.max(0, 1 - progress);
      if (this.floatTimer >= this.floatDuration) {
        this.isFloating = false;
        this.visible = false;
      }
    }
  }
}
