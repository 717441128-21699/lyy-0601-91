import { create } from 'zustand';
import type { GameState, GameStats } from '../types/game';
import type { Chart, PracticeSettings } from '../types/song';

interface GameStoreState {
  gameState: GameState;
  stats: GameStats;
  currentChart: Chart | null;
  practiceSettings: PracticeSettings | null;
  currentTime: number;
  countdown: number;
  showPauseMenu: boolean;

  setGameState: (state: GameState) => void;
  setStats: (stats: GameStats) => void;
  setCurrentChart: (chart: Chart | null) => void;
  setPracticeSettings: (settings: PracticeSettings | null) => void;
  setCurrentTime: (time: number) => void;
  setCountdown: (count: number) => void;
  setShowPauseMenu: (show: boolean) => void;
  resetGame: () => void;
}

const initialStats: GameStats = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  perfect: 0,
  good: 0,
  miss: 0,
  energy: 50,
  judgeHistory: [],
};

export const useGameStore = create<GameStoreState>((set) => ({
  gameState: 'ready',
  stats: initialStats,
  currentChart: null,
  practiceSettings: null,
  currentTime: 0,
  countdown: 3,
  showPauseMenu: false,

  setGameState: (state) => set({ gameState: state }),
  setStats: (stats) => set({ stats }),
  setCurrentChart: (chart) => set({ currentChart: chart }),
  setPracticeSettings: (settings) => set({ practiceSettings: settings }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setCountdown: (count) => set({ countdown: count }),
  setShowPauseMenu: (show) => set({ showPauseMenu: show }),

  resetGame: () =>
    set({
      gameState: 'ready',
      stats: initialStats,
      currentChart: null,
      practiceSettings: null,
      currentTime: 0,
      countdown: 3,
      showPauseMenu: false,
    }),
}));
