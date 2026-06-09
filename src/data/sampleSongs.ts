import type { Song, Chart, Note } from '../types/song';
import { generateId } from '../utils/math';

const generateNotes = (bpm: number, duration: number, keys: 4 | 6, density: number): Note[] => {
  const notes: Note[] = [];
  const beatInterval = 60000 / bpm;
  const totalBeats = Math.floor((duration * 1000) / beatInterval);

  for (let beat = 4; beat < totalBeats - 4; beat++) {
    const subdivisions = [1, 2, 4];
    const subdivision = subdivisions[Math.floor(Math.random() * subdivisions.length)];

    for (let sub = 0; sub < subdivision; sub++) {
      if (Math.random() < density / subdivision) {
        const time = (beat + sub / subdivision) * beatInterval;
        const lane = Math.floor(Math.random() * keys);

        const isHold = Math.random() < 0.15;
        const duration = isHold ? beatInterval * (1 + Math.random() * 2) : undefined;

        notes.push({
          id: generateId(),
          time: Math.round(time),
          lane,
          type: isHold ? 'hold' : 'tap',
          duration: duration ? Math.round(duration) : undefined,
        });
      }
    }
  }

  return notes.sort((a, b) => a.time - b.time);
};

const createSampleChart = (
  title: string,
  artist: string,
  bpm: number,
  keys: 4 | 6,
  level: number,
  duration: number
): Chart => {
  const density = Math.min(0.3 + level * 0.05, 0.8);
  return {
    version: '1.0',
    song: {
      title,
      artist,
      bpm,
      offset: 0,
    },
    difficulty: {
      name: level <= 5 ? 'Easy' : level <= 10 ? 'Normal' : level <= 15 ? 'Hard' : 'Expert',
      level,
      keys,
    },
    notes: generateNotes(bpm, duration, keys, density),
    timingPoints: [{ time: 0, bpm }],
  };
};

export const SAMPLE_CHARTS: Record<string, Chart> = {
  'neon-dreams-easy': createSampleChart('Neon Dreams', 'Synthwave 84', 128, 4, 5, 90),
  'neon-dreams-normal': createSampleChart('Neon Dreams', 'Synthwave 84', 128, 4, 9, 90),
  'neon-dreams-hard': createSampleChart('Neon Dreams', 'Synthwave 84', 128, 4, 13, 90),
  'neon-dreams-expert': createSampleChart('Neon Dreams', 'Synthwave 84', 128, 6, 17, 90),

  'cyber-rain-easy': createSampleChart('Cyber Rain', 'Digital Aurora', 140, 4, 4, 120),
  'cyber-rain-normal': createSampleChart('Cyber Rain', 'Digital Aurora', 140, 4, 8, 120),
  'cyber-rain-hard': createSampleChart('Cyber Rain', 'Digital Aurora', 140, 6, 12, 120),
  'cyber-rain-expert': createSampleChart('Cyber Rain', 'Digital Aurora', 140, 6, 16, 120),

  'retro-fever-easy': createSampleChart('Retro Fever', 'Pixel Hearts', 150, 4, 6, 100),
  'retro-fever-normal': createSampleChart('Retro Fever', 'Pixel Hearts', 150, 4, 10, 100),
  'retro-fever-hard': createSampleChart('Retro Fever', 'Pixel Hearts', 150, 6, 14, 100),

  'arcade-night-easy': createSampleChart('Arcade Night', '8-Bit Legends', 135, 4, 3, 85),
  'arcade-night-normal': createSampleChart('Arcade Night', '8-Bit Legends', 135, 4, 7, 85),
  'arcade-night-hard': createSampleChart('Arcade Night', '8-Bit Legends', 135, 6, 11, 85),
  'arcade-night-expert': createSampleChart('Arcade Night', '8-Bit Legends', 135, 6, 15, 85),

  'laser-beats-easy': createSampleChart('Laser Beats', 'Neon Pulse', 160, 4, 7, 95),
  'laser-beats-normal': createSampleChart('Laser Beats', 'Neon Pulse', 160, 4, 11, 95),
  'laser-beats-hard': createSampleChart('Laser Beats', 'Neon Pulse', 160, 6, 15, 95),
  'laser-beats-expert': createSampleChart('Laser Beats', 'Neon Pulse', 160, 6, 18, 95),
};

export const SAMPLE_SONGS: Song[] = [
  {
    id: 'neon-dreams',
    title: 'Neon Dreams',
    artist: 'Synthwave 84',
    folder: 'synthwave',
    audioFile: '',
    coverFile: '',
    bpm: 128,
    duration: 90,
    difficulties: [
      {
        id: 'neon-dreams-easy',
        songId: 'neon-dreams',
        name: 'Easy',
        level: 5,
        keys: 4,
        noteCount: SAMPLE_CHARTS['neon-dreams-easy'].notes.length,
        chartFile: 'neon-dreams-easy.json',
      },
      {
        id: 'neon-dreams-normal',
        songId: 'neon-dreams',
        name: 'Normal',
        level: 9,
        keys: 4,
        noteCount: SAMPLE_CHARTS['neon-dreams-normal'].notes.length,
        chartFile: 'neon-dreams-normal.json',
      },
      {
        id: 'neon-dreams-hard',
        songId: 'neon-dreams',
        name: 'Hard',
        level: 13,
        keys: 4,
        noteCount: SAMPLE_CHARTS['neon-dreams-hard'].notes.length,
        chartFile: 'neon-dreams-hard.json',
      },
      {
        id: 'neon-dreams-expert',
        songId: 'neon-dreams',
        name: 'Expert',
        level: 17,
        keys: 6,
        noteCount: SAMPLE_CHARTS['neon-dreams-expert'].notes.length,
        chartFile: 'neon-dreams-expert.json',
      },
    ],
  },
  {
    id: 'cyber-rain',
    title: 'Cyber Rain',
    artist: 'Digital Aurora',
    folder: 'electronic',
    audioFile: '',
    coverFile: '',
    bpm: 140,
    duration: 120,
    difficulties: [
      {
        id: 'cyber-rain-easy',
        songId: 'cyber-rain',
        name: 'Easy',
        level: 4,
        keys: 4,
        noteCount: SAMPLE_CHARTS['cyber-rain-easy'].notes.length,
        chartFile: 'cyber-rain-easy.json',
      },
      {
        id: 'cyber-rain-normal',
        songId: 'cyber-rain',
        name: 'Normal',
        level: 8,
        keys: 4,
        noteCount: SAMPLE_CHARTS['cyber-rain-normal'].notes.length,
        chartFile: 'cyber-rain-normal.json',
      },
      {
        id: 'cyber-rain-hard',
        songId: 'cyber-rain',
        name: 'Hard',
        level: 12,
        keys: 6,
        noteCount: SAMPLE_CHARTS['cyber-rain-hard'].notes.length,
        chartFile: 'cyber-rain-hard.json',
      },
      {
        id: 'cyber-rain-expert',
        songId: 'cyber-rain',
        name: 'Expert',
        level: 16,
        keys: 6,
        noteCount: SAMPLE_CHARTS['cyber-rain-expert'].notes.length,
        chartFile: 'cyber-rain-expert.json',
      },
    ],
  },
  {
    id: 'retro-fever',
    title: 'Retro Fever',
    artist: 'Pixel Hearts',
    folder: 'chiptune',
    audioFile: '',
    coverFile: '',
    bpm: 150,
    duration: 100,
    difficulties: [
      {
        id: 'retro-fever-easy',
        songId: 'retro-fever',
        name: 'Easy',
        level: 6,
        keys: 4,
        noteCount: SAMPLE_CHARTS['retro-fever-easy'].notes.length,
        chartFile: 'retro-fever-easy.json',
      },
      {
        id: 'retro-fever-normal',
        songId: 'retro-fever',
        name: 'Normal',
        level: 10,
        keys: 4,
        noteCount: SAMPLE_CHARTS['retro-fever-normal'].notes.length,
        chartFile: 'retro-fever-normal.json',
      },
      {
        id: 'retro-fever-hard',
        songId: 'retro-fever',
        name: 'Hard',
        level: 14,
        keys: 6,
        noteCount: SAMPLE_CHARTS['retro-fever-hard'].notes.length,
        chartFile: 'retro-fever-hard.json',
      },
    ],
  },
  {
    id: 'arcade-night',
    title: 'Arcade Night',
    artist: '8-Bit Legends',
    folder: 'retro',
    audioFile: '',
    coverFile: '',
    bpm: 135,
    duration: 85,
    difficulties: [
      {
        id: 'arcade-night-easy',
        songId: 'arcade-night',
        name: 'Easy',
        level: 3,
        keys: 4,
        noteCount: SAMPLE_CHARTS['arcade-night-easy'].notes.length,
        chartFile: 'arcade-night-easy.json',
      },
      {
        id: 'arcade-night-normal',
        songId: 'arcade-night',
        name: 'Normal',
        level: 7,
        keys: 4,
        noteCount: SAMPLE_CHARTS['arcade-night-normal'].notes.length,
        chartFile: 'arcade-night-normal.json',
      },
      {
        id: 'arcade-night-hard',
        songId: 'arcade-night',
        name: 'Hard',
        level: 11,
        keys: 6,
        noteCount: SAMPLE_CHARTS['arcade-night-hard'].notes.length,
        chartFile: 'arcade-night-hard.json',
      },
      {
        id: 'arcade-night-expert',
        songId: 'arcade-night',
        name: 'Expert',
        level: 15,
        keys: 6,
        noteCount: SAMPLE_CHARTS['arcade-night-expert'].notes.length,
        chartFile: 'arcade-night-expert.json',
      },
    ],
  },
  {
    id: 'laser-beats',
    title: 'Laser Beats',
    artist: 'Neon Pulse',
    folder: 'techno',
    audioFile: '',
    coverFile: '',
    bpm: 160,
    duration: 95,
    difficulties: [
      {
        id: 'laser-beats-easy',
        songId: 'laser-beats',
        name: 'Easy',
        level: 7,
        keys: 4,
        noteCount: SAMPLE_CHARTS['laser-beats-easy'].notes.length,
        chartFile: 'laser-beats-easy.json',
      },
      {
        id: 'laser-beats-normal',
        songId: 'laser-beats',
        name: 'Normal',
        level: 11,
        keys: 4,
        noteCount: SAMPLE_CHARTS['laser-beats-normal'].notes.length,
        chartFile: 'laser-beats-normal.json',
      },
      {
        id: 'laser-beats-hard',
        songId: 'laser-beats',
        name: 'Hard',
        level: 15,
        keys: 6,
        noteCount: SAMPLE_CHARTS['laser-beats-hard'].notes.length,
        chartFile: 'laser-beats-hard.json',
      },
      {
        id: 'laser-beats-expert',
        songId: 'laser-beats',
        name: 'Expert',
        level: 18,
        keys: 6,
        noteCount: SAMPLE_CHARTS['laser-beats-expert'].notes.length,
        chartFile: 'laser-beats-expert.json',
      },
    ],
  },
];

export const getSampleChart = (chartId: string): Chart | undefined => {
  return SAMPLE_CHARTS[chartId];
};
