import { create } from 'zustand';
import type { Song, Difficulty, Score, Chart } from '../types/song';
import { SAMPLE_SONGS, SAMPLE_CHARTS } from '../data/sampleSongs';

export interface ImportPreviewItem {
  song: Song;
  chart: Chart;
  action: 'new' | 'add' | 'replace';
  existingDifficulty?: Difficulty;
}

export interface ImportPreview {
  items: ImportPreviewItem[];
  newSongs: number;
  addedDifficulties: number;
  replacedDifficulties: number;
}

interface SongState {
  songs: Song[];
  customCharts: Record<string, Chart>;
  selectedSong: Song | null;
  selectedDifficulty: Difficulty | null;
  scores: Record<string, Score>;
  isLoading: boolean;
  importPreview: ImportPreview | null;
  setSongs: (songs: Song[]) => void;
  selectSong: (song: Song | null) => void;
  selectDifficulty: (difficulty: Difficulty | null) => void;
  addSong: (song: Song, chart?: Chart) => void;
  removeSong: (songId: string) => void;
  saveScore: (score: Score) => void;
  getBestScore: (difficultyId: string) => Score | null;
  getTotalPlayCount: () => number;
  getChart: (difficultyId: string) => Chart | null;
  isBuiltInSong: (songId: string) => boolean;
  isBuiltInDifficulty: (songId: string, difficultyId: string) => boolean;
  updateDifficulty: (songId: string, difficultyId: string, updates: Partial<Difficulty>) => void;
  removeDifficulty: (songId: string, difficultyId: string) => void;
  replaceDifficultyChart: (songId: string, difficultyId: string, chart: Chart) => void;
  setImportPreview: (preview: ImportPreview | null) => void;
  confirmImport: () => void;
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

const buildMergedSongs = (customSongs: Song[]): Song[] => {
  const customSongMap = new Map(customSongs.map(s => [s.id, s]));
  const result: Song[] = [];

  for (const sampleSong of SAMPLE_SONGS) {
    const customVersion = customSongMap.get(sampleSong.id);
    if (customVersion) {
      result.push(customVersion);
      customSongMap.delete(sampleSong.id);
    } else {
      result.push(sampleSong);
    }
  }

  for (const customSong of customSongMap.values()) {
    result.push(customSong);
  }

  return result;
};

const getSampleChart = (difficultyId: string): Chart | null => {
  return SAMPLE_CHARTS[difficultyId] || null;
};

export const useSongStore = create<SongState>((set, get) => {
  const initialCustomSongs = loadCustomSongsFromStorage();

  return {
    songs: buildMergedSongs(initialCustomSongs),
    customCharts: loadCustomChartsFromStorage(),
    selectedSong: null,
    selectedDifficulty: null,
    scores: loadScoresFromStorage(),
    isLoading: false,
    importPreview: null,

    setSongs: (songs) => set({ songs }),

    selectSong: (song) => set({ selectedSong: song, selectedDifficulty: null }),

    selectDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),

    addSong: (song, chart) =>
      set((state) => {
        const customSongs = loadCustomSongsFromStorage();
        const customSongMap = new Map(customSongs.map(s => [s.id, s]));
        const existingSampleSong = SAMPLE_SONGS.find((s) => s.id === song.id);
        const existingCustomSong = customSongMap.get(song.id);
        const existingSong = existingCustomSong || existingSampleSong;

        let newCustomSongs: Song[];

        if (existingSong) {
          const mergedDifficulties = [
            ...existingSong.difficulties.filter(
              (d) => !song.difficulties.find((nd) => nd.id === d.id)
            ),
            ...song.difficulties,
          ];

          const updatedSong = { ...existingSong, difficulties: mergedDifficulties };
          customSongMap.set(song.id, updatedSong);
          newCustomSongs = Array.from(customSongMap.values());
        } else {
          newCustomSongs = [...customSongs, song];
        }

        saveCustomSongsToStorage(newCustomSongs);

        const newCharts = { ...state.customCharts };
        if (chart) {
          newCharts[chart.difficulty.id] = chart;
          saveCustomChartsToStorage(newCharts);
        }

        return {
          songs: buildMergedSongs(newCustomSongs),
          customCharts: newCharts,
        };
      }),

    removeSong: (songId) =>
      set((state) => {
        const song = state.songs.find((s) => s.id === songId);
        if (!song) return state;

        const isBuiltIn = SAMPLE_SONGS.find((ss) => ss.id === songId);
        const customSongs = loadCustomSongsFromStorage();

        let newCustomSongs: Song[];

        if (isBuiltIn) {
          const customSongMap = new Map(customSongs.map(s => [s.id, s]));
          customSongMap.delete(songId);
          newCustomSongs = Array.from(customSongMap.values());
        } else {
          newCustomSongs = customSongs.filter((s) => s.id !== songId);
        }

        saveCustomSongsToStorage(newCustomSongs);

        const newCharts = { ...state.customCharts };
        song.difficulties.forEach((d) => {
          delete newCharts[d.id];
        });
        saveCustomChartsToStorage(newCharts);

        return {
          songs: buildMergedSongs(newCustomSongs),
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
      return state.customCharts[difficultyId] || getSampleChart(difficultyId);
    },

    isBuiltInSong: (songId) => {
      return SAMPLE_SONGS.some((s) => s.id === songId);
    },

    isBuiltInDifficulty: (songId, difficultyId) => {
      const sampleSong = SAMPLE_SONGS.find((s) => s.id === songId);
      if (!sampleSong) return false;
      return sampleSong.difficulties.some((d) => d.id === difficultyId);
    },

    updateDifficulty: (songId, difficultyId, updates) =>
      set((state) => {
        const customSongs = loadCustomSongsFromStorage();
        const customSongMap = new Map(customSongs.map(s => [s.id, s]));
        const existingSampleSong = SAMPLE_SONGS.find((s) => s.id === songId);
        const existingCustomSong = customSongMap.get(songId);
        const existingSong = existingCustomSong || existingSampleSong;

        if (!existingSong) return state;

        const isBuiltInDiff = existingSong.difficulties.some(
          (d) => d.id === difficultyId && SAMPLE_SONGS.some(
            (ss) => ss.id === songId && ss.difficulties.some((sd) => sd.id === difficultyId)
          )
        );

        if (isBuiltInDiff) {
          console.warn('Cannot update built-in difficulty');
          return state;
        }

        const updatedDifficulties = existingSong.difficulties.map((d) =>
          d.id === difficultyId ? { ...d, ...updates } : d
        );

        const updatedSong = { ...existingSong, difficulties: updatedDifficulties };
        customSongMap.set(songId, updatedSong);
        const newCustomSongs = Array.from(customSongMap.values());

        saveCustomSongsToStorage(newCustomSongs);

        return {
          songs: buildMergedSongs(newCustomSongs),
        };
      }),

    removeDifficulty: (songId, difficultyId) =>
      set((state) => {
        const customSongs = loadCustomSongsFromStorage();
        const customSongMap = new Map(customSongs.map(s => [s.id, s]));
        const existingSampleSong = SAMPLE_SONGS.find((s) => s.id === songId);
        const existingCustomSong = customSongMap.get(songId);
        const existingSong = existingCustomSong || existingSampleSong;

        if (!existingSong) return state;

        const sampleSong = SAMPLE_SONGS.find((s) => s.id === songId);
        const isBuiltInDiff = sampleSong?.difficulties.some((d) => d.id === difficultyId);

        if (isBuiltInDiff) {
          console.warn('Cannot delete built-in difficulty');
          return state;
        }

        const filteredDifficulties = existingSong.difficulties.filter(
          (d) => d.id !== difficultyId
        );

        let newCustomSongs: Song[];

        if (filteredDifficulties.length === 0 && !sampleSong) {
          customSongMap.delete(songId);
          newCustomSongs = Array.from(customSongMap.values());
        } else {
          const updatedSong = { ...existingSong, difficulties: filteredDifficulties };
          customSongMap.set(songId, updatedSong);
          newCustomSongs = Array.from(customSongMap.values());
        }

        saveCustomSongsToStorage(newCustomSongs);

        const newCharts = { ...state.customCharts };
        delete newCharts[difficultyId];
        saveCustomChartsToStorage(newCharts);

        return {
          songs: buildMergedSongs(newCustomSongs),
          customCharts: newCharts,
        };
      }),

    replaceDifficultyChart: (songId, difficultyId, chart) =>
      set((state) => {
        const customSongs = loadCustomSongsFromStorage();
        const customSongMap = new Map(customSongs.map(s => [s.id, s]));
        const existingSampleSong = SAMPLE_SONGS.find((s) => s.id === songId);
        const existingCustomSong = customSongMap.get(songId);
        const existingSong = existingCustomSong || existingSampleSong;

        if (!existingSong) return state;

        const sampleSong = SAMPLE_SONGS.find((s) => s.id === songId);
        const isBuiltInDiff = sampleSong?.difficulties.some((d) => d.id === difficultyId);

        if (isBuiltInDiff) {
          console.warn('Cannot replace built-in difficulty chart');
          return state;
        }

        const updatedDifficulties = existingSong.difficulties.map((d) =>
          d.id === difficultyId
            ? {
                ...d,
                name: chart.difficulty.name,
                level: chart.difficulty.level,
                keys: chart.difficulty.keys,
                noteCount: chart.notes.length,
              }
            : d
        );

        const updatedSong = { ...existingSong, difficulties: updatedDifficulties };
        customSongMap.set(songId, updatedSong);
        const newCustomSongs = Array.from(customSongMap.values());

        saveCustomSongsToStorage(newCustomSongs);

        const newCharts = { ...state.customCharts };
        newCharts[difficultyId] = {
          ...chart,
          difficulty: {
            ...chart.difficulty,
            id: difficultyId,
            songId,
            noteCount: chart.notes.length,
          },
        };
        saveCustomChartsToStorage(newCharts);

        return {
          songs: buildMergedSongs(newCustomSongs),
          customCharts: newCharts,
        };
      }),

    setImportPreview: (preview) => set({ importPreview: preview }),

    confirmImport: () =>
      set((state) => {
        if (!state.importPreview) return state;

        const customSongs = loadCustomSongsFromStorage();
        const customSongMap = new Map(customSongs.map(s => [s.id, s]));
        const newCharts = { ...state.customCharts };

        for (const item of state.importPreview.items) {
          const { song, chart } = item;
          const existingSampleSong = SAMPLE_SONGS.find((s) => s.id === song.id);
          const existingCustomSong = customSongMap.get(song.id);
          const existingSong = existingCustomSong || existingSampleSong;

          if (existingSong) {
            const mergedDifficulties = [
              ...existingSong.difficulties.filter(
                (d) => !song.difficulties.find((nd) => nd.id === d.id)
              ),
              ...song.difficulties,
            ];

            const updatedSong = { ...existingSong, difficulties: mergedDifficulties };
            customSongMap.set(song.id, updatedSong);
          } else {
            customSongMap.set(song.id, song);
          }

          if (chart) {
            newCharts[chart.difficulty.id] = chart;
          }
        }

        const newCustomSongs = Array.from(customSongMap.values());
        saveCustomSongsToStorage(newCustomSongs);
        saveCustomChartsToStorage(newCharts);

        return {
          songs: buildMergedSongs(newCustomSongs),
          customCharts: newCharts,
          importPreview: null,
        };
      }),

    setLoading: (loading) => set({ isLoading: loading }),
  };
});
