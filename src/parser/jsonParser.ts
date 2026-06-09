import type { Chart, Note } from '../types/song';
import { generateId } from '../utils/math';

export const parseJsonChart = (data: unknown): Chart => {
  const chart = data as Chart;

  if (!chart.notes || !Array.isArray(chart.notes)) {
    throw new Error('Invalid chart format: missing notes array');
  }

  const notes = chart.notes
    .map((note) => ({
      ...note,
      id: note.id || generateId(),
    }))
    .sort((a: Note, b: Note) => a.time - b.time);

  return {
    ...chart,
    notes,
  };
};

export const createEmptyChart = (
  title: string,
  artist: string,
  bpm: number,
  keys: 4 | 6
): Chart => ({
  version: '1.0',
  song: {
    title,
    artist,
    bpm,
    offset: 0,
  },
  difficulty: {
    name: 'Normal',
    level: 10,
    keys,
  },
  notes: [],
  timingPoints: [
    {
      time: 0,
      bpm,
    },
  ],
});

export const validateChart = (chart: Chart): boolean => {
  if (!chart.song || !chart.difficulty || !chart.notes) {
    return false;
  }

  const { keys } = chart.difficulty;
  if (keys !== 4 && keys !== 6) {
    return false;
  }

  for (const note of chart.notes) {
    if (note.lane < 0 || note.lane >= keys) {
      return false;
    }
    if (typeof note.time !== 'number' || note.time < 0) {
      return false;
    }
  }

  return true;
};
