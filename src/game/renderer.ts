import type { NoteState, Particle, FloatingText, LaneState } from '../types/game';
import { LANE_COLORS, glowColor, clearGlow } from '../utils/color';
import { generateId, randomRange, easeOutQuad } from '../utils/math';

export interface RenderConfig {
  width: number;
  height: number;
  keys: 4 | 6;
  noteSpeed: number;
  judgeLineY: number;
  laneWidth: number;
  noteHeight: number;
}

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: RenderConfig;
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private laneFlash: Map<number, number> = new Map();
  private scanlineCanvas: HTMLCanvasElement;
  private scanlineCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, config: RenderConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = config;

    this.scanlineCanvas = document.createElement('canvas');
    this.scanlineCanvas.width = 1;
    this.scanlineCanvas.height = 4;
    this.scanlineCtx = this.scanlineCanvas.getContext('2d')!;
    this.generateScanlines();
  }

  private generateScanlines(): void {
    const ctx = this.scanlineCtx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, 1, 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(0, 2, 1, 2);
  }

  setConfig(config: Partial<RenderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): RenderConfig {
    return { ...this.config };
  }

  clear(): void {
    const { width, height } = this.config;
    this.ctx.fillStyle = '#0A0A0F';
    this.ctx.fillRect(0, 0, width, height);
  }

  drawBackground(coverImage?: HTMLImageElement, dim: number = 0.3): void {
    const { width, height } = this.config;

    if (coverImage) {
      this.ctx.globalAlpha = 1 - dim;
      const scale = Math.max(width / coverImage.width, height / coverImage.height);
      const w = coverImage.width * scale;
      const h = coverImage.height * scale;
      const x = (width - w) / 2;
      const y = (height - h) / 2;
      this.ctx.drawImage(coverImage, x, y, w, h);
      this.ctx.globalAlpha = 1;
    }

    const gradient = this.ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      width * 0.7
    );
    gradient.addColorStop(0, 'rgba(10, 10, 15, 0)');
    gradient.addColorStop(1, 'rgba(10, 10, 15, 0.8)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);

    this.drawGrid();
  }

  private drawGrid(): void {
    const { width, height } = this.config;
    this.ctx.strokeStyle = 'rgba(157, 0, 255, 0.1)';
    this.ctx.lineWidth = 1;

    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
  }

  drawLanes(laneStates: LaneState[]): void {
    const { keys, judgeLineY, laneWidth, width } = this.config;
    const totalLaneWidth = laneWidth * keys;
    const startX = (width - totalLaneWidth) / 2;

    for (let i = 0; i < keys; i++) {
      const x = startX + i * laneWidth;
      const color = LANE_COLORS[i];
      const flashAlpha = this.laneFlash.get(i) || 0;

      const gradient = this.ctx.createLinearGradient(x, 0, x, judgeLineY);
      gradient.addColorStop(0, `${color}00`);
      gradient.addColorStop(0.7, `${color}10`);
      gradient.addColorStop(1, `${color}30`);

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, 0, laneWidth, judgeLineY);

      if (flashAlpha > 0) {
        this.ctx.fillStyle = `${color}${Math.floor(flashAlpha * 80).toString(16).padStart(2, '0')}`;
        this.ctx.fillRect(x, 0, laneWidth, judgeLineY);
        this.laneFlash.set(i, flashAlpha - 0.05);
      }

      this.ctx.strokeStyle = `${color}40`;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, judgeLineY);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(x + laneWidth, 0);
      this.ctx.lineTo(x + laneWidth, judgeLineY);
      this.ctx.stroke();

      const isPressed = laneStates[i]?.pressed;
      this.drawKeyIndicator(x + laneWidth / 2, judgeLineY + 30, laneWidth * 0.8, color, isPressed);
    }
  }

  private drawKeyIndicator(
    x: number,
    y: number,
    width: number,
    color: string,
    pressed: boolean
  ): void {
    const height = 20;
    const radius = 4;

    glowColor(this.ctx, color, pressed ? 20 : 5);

    this.ctx.fillStyle = pressed ? color : `${color}40`;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;

    this.roundRect(x - width / 2, y - height / 2, width, height, radius);
    this.ctx.fill();
    this.ctx.stroke();

    clearGlow(this.ctx);
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  drawJudgeLine(): void {
    const { width, keys, judgeLineY, laneWidth } = this.config;
    const totalLaneWidth = laneWidth * keys;
    const startX = (width - totalLaneWidth) / 2;
    const endX = startX + totalLaneWidth;

    const gradient = this.ctx.createLinearGradient(startX, judgeLineY, endX, judgeLineY);
    gradient.addColorStop(0, '#FF2D95');
    gradient.addColorStop(0.5, '#00F5FF');
    gradient.addColorStop(1, '#9D00FF');

    glowColor(this.ctx, '#00F5FF', 15);

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, judgeLineY);
    this.ctx.lineTo(endX, judgeLineY);
    this.ctx.stroke();

    clearGlow(this.ctx);
  }

  drawNotes(notes: NoteState[], currentTime: number): void {
    const { keys, judgeLineY, laneWidth, width, noteSpeed, noteHeight } = this.config;
    const totalLaneWidth = laneWidth * keys;
    const startX = (width - totalLaneWidth) / 2;

    const lookAheadTime = (judgeLineY / noteSpeed) * 1000;

    for (const note of notes) {
      if (note.judged) continue;

      const timeUntilHit = note.time - currentTime;
      if (timeUntilHit > lookAheadTime) continue;
      if (timeUntilHit < -500) continue;

      const noteY = judgeLineY - (timeUntilHit / 1000) * noteSpeed;
      const laneX = startX + note.lane * laneWidth;
      const color = LANE_COLORS[note.lane];

      if (note.type === 'hold' && note.duration) {
        this.drawHoldNote(laneX, noteY, laneWidth * 0.85, noteHeight, note.duration, color, currentTime);
      } else {
        this.drawTapNote(laneX + laneWidth / 2, noteY, laneWidth * 0.85, noteHeight, color);
      }
    }
  }

  private drawTapNote(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  ): void {
    glowColor(this.ctx, color, 10);

    this.ctx.fillStyle = color;
    this.roundRect(x - width / 2, y - height / 2, width, height, 4);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.roundRect(x - width / 2 + 2, y - height / 2 + 2, width - 4, height / 3, 2);
    this.ctx.fill();

    clearGlow(this.ctx);
  }

  private drawHoldNote(
    laneX: number,
    y: number,
    width: number,
    height: number,
    duration: number,
    color: string,
    currentTime: number
  ): void {
    const { noteSpeed } = this.config;
    const holdHeight = (duration / 1000) * noteSpeed;
    const bodyY = y - holdHeight;

    const { laneWidth } = this.config;
    const gradient = this.ctx.createLinearGradient(0, bodyY, 0, y);
    gradient.addColorStop(0, `${color}00`);
    gradient.addColorStop(0.3, `${color}60`);
    gradient.addColorStop(1, color);

    glowColor(this.ctx, color, 8);

    this.ctx.fillStyle = gradient;
    this.roundRect(laneX + (laneWidth - width) / 2, bodyY, width, holdHeight, 6);
    this.ctx.fill();

    this.drawTapNote(laneX + laneWidth / 2, y, width, height, color);

    clearGlow(this.ctx);
  }

  drawParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += 0.3 * deltaTime;
      p.life -= deltaTime;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      const alpha = p.life / p.maxLife;
      glowColor(this.ctx, p.color, p.size * alpha);

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.globalAlpha = 1;
      clearGlow(this.ctx);
    }
  }

  drawFloatingTexts(deltaTime: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];

      t.y -= 1.5 * deltaTime;
      t.life -= deltaTime;

      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

      const alpha = easeOutQuad(t.life / t.maxLife);
      const scale = 0.8 + alpha * 0.4;

      glowColor(this.ctx, t.color, 15);

      this.ctx.save();
      this.ctx.translate(t.x, t.y);
      this.ctx.scale(scale, scale);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = t.color;
      this.ctx.font = 'bold 28px "Press Start 2P", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(t.text, 0, 0);
      this.ctx.restore();

      this.ctx.globalAlpha = 1;
      clearGlow(this.ctx);
    }
  }

  drawScanlines(): void {
    const { width, height } = this.config;
    const pattern = this.ctx.createPattern(this.scanlineCanvas, 'repeat');
    if (pattern) {
      this.ctx.fillStyle = pattern;
      this.ctx.fillRect(0, 0, width, height);
    }

    const vignette = this.ctx.createRadialGradient(
      width / 2,
      height / 2,
      height * 0.3,
      width / 2,
      height / 2,
      height * 0.8
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, width, height);
  }

  spawnHitParticles(lane: number, color: string): void {
    const { keys, judgeLineY, laneWidth, width } = this.config;
    const totalLaneWidth = laneWidth * keys;
    const startX = (width - totalLaneWidth) / 2;
    const x = startX + lane * laneWidth + laneWidth / 2;

    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + randomRange(-0.2, 0.2);
      const speed = randomRange(0.2, 0.6);

      this.particles.push({
        id: generateId(),
        x,
        y: judgeLineY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.2,
        color,
        size: randomRange(3, 6),
        life: 800,
        maxLife: 800,
      });
    }

    this.laneFlash.set(lane, 1);
  }

  spawnFloatingText(text: string, lane: number, color: string): void {
    const { keys, judgeLineY, laneWidth, width } = this.config;
    const totalLaneWidth = laneWidth * keys;
    const startX = (width - totalLaneWidth) / 2;
    const x = startX + lane * laneWidth + laneWidth / 2;

    this.floatingTexts.push({
      id: generateId(),
      text,
      x,
      y: judgeLineY - 50,
      color,
      life: 1000,
      maxLife: 1000,
    });
  }

  getNoteY(time: number, currentTime: number): number {
    const { judgeLineY, noteSpeed } = this.config;
    const timeUntilHit = time - currentTime;
    return judgeLineY - (timeUntilHit / 1000) * noteSpeed;
  }

  clearEffects(): void {
    this.particles = [];
    this.floatingTexts = [];
    this.laneFlash.clear();
  }

  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.config.judgeLineY = height * 0.8;
  }
}
