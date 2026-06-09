import { create } from 'zustand';
import type { Song, Difficulty, Score, Chart } from '../types/song';
import { SAMPLE_SONGS } from '../data/sampleSongs';

interface SongState {
  songs: Song[];
  customCharts: Record<string, Chart>;
  selectedSong: Song | null;
  selectedDifficulty: Difficulty | null;
  scores: Record<string, Score>;
  isLoading: boolean;
  setSongs: (songs: Song[]) => void;
  selectSong: (song: Song | null) => void;
  selectDifficulty: (difficulty: Difficulty | null) => void;
  addSong: (song: Song, chart?: Chart) => void;
  removeSong: (songId: string) => void;
  saveScore: (score: Score) => void;
  getBestScore: (difficultyId: string) => Score | null;
  getTotalPlayCount: () => number;
  getChart: (difficultyId: string) => Chart | null;
  setLoading: (loading: boolean) => void;
}

const loadScoresFromStorage = (): Record<string, Score> => {
  try {
    const stored = localStorage.getItem('arcade-rhythm-scores');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const loadCustomSongsFromStorage = (): Song[] => {
  try {
    const stored = localStorage.getItem('arcade-rhythm-custom-songs');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const loadCustomChartsFromStorage = (): Record<string, Chart> => {
  try {
    const stored = localStorage.getItem('arcade-rhythm-custom-charts');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveCustomSongsToStorage = (songs: Song[]) => {
  try {
    localStorage.setItem('arcade-rhythm-custom-songs', JSON.stringify(songs));
  } catch {
    // Ignore storage errors
  }
};

const saveCustomChartsToStorage = (charts: Record<string, Chart>) => {
  try {
    localStorage.setItem('arcade-rhythm-custom-charts', JSON.stringify(charts));
  } catch {
    // Ignore storage errors
  }
};

export const useSongStore = create<SongState>((set, get) => ({
  songs: [...SAMPLE_SONGS, ...loadCustomSongsFromStorage()],
  customCharts: loadCustomChartsFromStorage(),
  selectedSong: null,
  selectedDifficulty: null,
  scores: loadScoresFromStorage(),
  isLoading: false,

  setSongs: (songs) => set({ songs }),

  selectSong: (song) => set({ selectedSong: song, selectedDifficulty: null }),

  selectDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),

  addSong: (song, chart) =>
    set((state) => {
      const customSongs = state.songs.filter((s) => !SAMPLE_SONGS.find((ss) => ss.id === s.id));
      const newCustomSongs = [...customSongs, song];
      saveCustomSongsToStorage(newCustomSongs);

      const newCharts = { ...state.customCharts };
      if (chart) {
        newCharts[chart.difficulty.id] = chart;
        saveCustomChartsToStorage(newCharts);
      }

      return {
        songs: [...SAMPLE_SONGS, ...newCustomSongs],
        customCharts: newCharts,
      };
    }),

  removeSong: (songId) =>
    set((state) => {
      const song = state.songs.find((s) => s.id === songId);
      if (!song || SAMPLE_SONGS.find((ss) => ss.id === songId)) {
        return state;
      }

      const customSongs = state.songs.filter(
        (s) => !SAMPLE_SONGS.find((ss) => ss.id === s.id) && s.id !== songId
      );
      saveCustomSongsToStorage(customSongs);

      const newCharts = { ...state.customCharts };
      song.difficulties.forEach((d) => {
        delete newCharts[d.id];
      });
      saveCustomChartsToStorage(newCharts);

      return {
        songs: [...SAMPLE_SONGS, ...customSongs],
        customCharts: newCharts,
      };
    }),

  saveScore: (score) =>
    set((state) => {
      const existing = state.scores[score.difficultyId];
      if (!existing || score.score > existing.score) {
        const newScores = {
          ...state.scores,
          [score.difficultyId]: score,
        };
        localStorage.setItem('arcade-rhythm-scores', JSON.stringify(newScores));
        return { scores: newScores };
      }
      return state;
    }),

  getBestScore: (difficultyId) => {
    const state = get();
    return state.scores[difficultyId] || null;
  },

  getTotalPlayCount: () => {
    const state = get();
    return Object.keys(state.scores).length;
  },

  getChart: (difficultyId) => {
    const state = get();
    return state.customCharts[difficultyId] || null;
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
