import type { Note, JudgementType, JudgeEvent } from './song';

export type GameState = 'ready' | 'playing' | 'paused' | 'finished' | 'failed';

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  good: number;
  miss: number;
  energy: number;
  judgeHistory: JudgeEvent[];
}

export interface NoteState extends Note {
  hit: boolean;
  judged: boolean;
  y?: number;
  holdProgress?: number;
}

export interface JudgeResult {
  judgement: JudgementType;
  delta: number;
  score: number;
}

export interface JudgeConfig {
  perfectWindow: number;
  goodWindow: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface LaneState {
  lane: number;
  pressed: boolean;
  pressTime: number;
}
