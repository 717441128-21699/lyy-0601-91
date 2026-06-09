import type { NoteState, JudgeResult, JudgeConfig } from '../types/game';
import type { JudgementType } from '../types/song';

export class JudgeSystem {
  private config: JudgeConfig;

  constructor(config: JudgeConfig) {
    this.config = config;
  }

  checkNoteHit(note: NoteState, hitTime: number, currentTime: number): JudgeResult | null {
    if (note.judged || note.hit) {
      return null;
    }

    const targetTime = note.time;
    const delta = hitTime - targetTime;
    const absDelta = Math.abs(delta);

    if (absDelta > this.config.goodWindow) {
      return null;
    }

    let judgement: JudgementType;
    let scoreMultiplier: number;

    if (absDelta <= this.config.perfectWindow) {
      judgement = 'perfect';
      scoreMultiplier = 1.0;
    } else {
      judgement = 'good';
      scoreMultiplier = 0.5;
    }

    const baseScore = 1000;
    const score = Math.round(baseScore * scoreMultiplier);

    return {
      judgement,
      delta,
      score,
    };
  }

  checkNoteMiss(note: NoteState, currentTime: number): boolean {
    if (note.judged || note.hit) {
      return false;
    }

    const missThreshold = note.time + this.config.goodWindow;
    return currentTime >= missThreshold;
  }

  getGrade(
    perfect: number,
    good: number,
    miss: number,
    total: number
  ): string {
    if (total === 0) return 'F';

    const accuracy = (perfect + good * 0.5) / total;

    if (accuracy >= 0.98) return 'S';
    if (accuracy >= 0.95) return 'A';
    if (accuracy >= 0.90) return 'B';
    if (accuracy >= 0.80) return 'C';
    if (accuracy >= 0.60) return 'D';
    return 'F';
  }

  calculateScore(
    judgement: JudgementType,
    combo: number,
    totalNotes: number
  ): number {
    const baseScores: Record<JudgementType, number> = {
      perfect: 1000,
      good: 500,
      miss: 0,
    };

    const baseScore = baseScores[judgement];
    const comboBonus = Math.min(combo * 0.1, 2.0);
    const noteWeight = 1000000 / totalNotes;

    return Math.round(baseScore * comboBonus * (noteWeight / 1000));
  }

  getEnergyDelta(judgement: JudgementType): number {
    switch (judgement) {
      case 'perfect':
        return 2;
      case 'good':
        return 1;
      case 'miss':
        return -5;
      default:
        return 0;
    }
  }

  updateConfig(config: Partial<JudgeConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const DEFAULT_JUDGE_CONFIG: JudgeConfig = {
  perfectWindow: 50,
  goodWindow: 120,
};
