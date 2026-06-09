import { create } from 'zustand';
import type { Song, Difficulty, Score } from '../types/song';
import { SAMPLE_SONGS } from '../data/sampleSongs';

interface SongState {
  songs: Song[];
  selectedSong: Song | null;
  selectedDifficulty: Difficulty | null;
  scores: Record<string, Score>;
  isLoading: boolean;
  setSongs: (songs: Song[]) => void;
  selectSong: (song: Song | null) => void;
  selectDifficulty: (difficulty: Difficulty | null) => void;
  addSong: (song: Song) => void;
  removeSong: (songId: string) => void;
  saveScore: (score: Score) => void;
  getBestScore: (difficultyId: string) => Score | null;
  getTotalPlayCount: () => number;
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

export const useSongStore = create<SongState>((set, get) => ({
  songs: SAMPLE_SONGS,
  selectedSong: null,
  selectedDifficulty: null,
  scores: loadScoresFromStorage(),
  isLoading: false,

  setSongs: (songs) => set({ songs }),

  selectSong: (song) => set({ selectedSong: song, selectedDifficulty: null }),

  selectDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),

  addSong: (song) =>
    set((state) => ({
      songs: [...state.songs, song],
    })),

  removeSong: (songId) =>
    set((state) => ({
      songs: state.songs.filter((s) => s.id !== songId),
    })),

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

  setLoading: (loading) => set({ isLoading: loading }),
}));
