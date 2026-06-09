export interface Song {
  id: string;
  title: string;
  artist: string;
  folder: string;
  audioFile: string;
  coverFile: string;
  bpm: number;
  duration: number;
  difficulties: Difficulty[];
}

export interface Difficulty {
  id: string;
  songId: string;
  name: string;
  level: number;
  keys: 4 | 6;
  noteCount: number;
  chartFile: string;
}

export interface Chart {
  version: string;
  song: {
    title: string;
    artist: string;
    bpm: number;
    offset: number;
  };
  difficulty: {
    name: string;
    level: number;
    keys: 4 | 6;
  };
  notes: Note[];
  timingPoints?: TimingPoint[];
}

export interface Note {
  time: number;
  lane: number;
  type: 'tap' | 'hold' | 'slide';
  duration?: number;
  id?: string;
}

export interface TimingPoint {
  time: number;
  bpm: number;
}

export interface Score {
  id: string;
  songId: string;
  difficultyId: string;
  score: number;
  maxCombo: number;
  perfect: number;
  good: number;
  miss: number;
  grade: string;
  timestamp: string;
  judgeHistory?: JudgeEvent[];
}

export interface JudgeEvent {
  time: number;
  lane: number;
  judgement: JudgementType;
  delta: number;
}

export type JudgementType = 'perfect' | 'good' | 'miss';

export type GameMode = 'normal' | 'practice';

export interface PracticeSettings {
  startTime: number;
  endTime: number;
  loop: boolean;
  speed: number;
}
