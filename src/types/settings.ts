export interface KeyMapping {
  [key: number]: string;
}

export interface Settings {
  keyMapping4: KeyMapping;
  keyMapping6: KeyMapping;
  masterVolume: number;
  musicVolume: number;
  effectVolume: number;
  noteSpeed: number;
  inputOffset: number;
  judgeWindow: {
    perfect: number;
    good: number;
  };
  resolution: string;
  fullscreen: boolean;
  showHitEffect: boolean;
  showCombo: boolean;
  backgroundDim: number;
}

export const DEFAULT_KEY_MAPPING_4: KeyMapping = {
  0: 'KeyD',
  1: 'KeyF',
  2: 'KeyJ',
  3: 'KeyK',
};

export const DEFAULT_KEY_MAPPING_6: KeyMapping = {
  0: 'KeyS',
  1: 'KeyD',
  2: 'KeyF',
  3: 'KeyJ',
  4: 'KeyK',
  5: 'KeyL',
};

export const DEFAULT_SETTINGS: Settings = {
  keyMapping4: DEFAULT_KEY_MAPPING_4,
  keyMapping6: DEFAULT_KEY_MAPPING_6,
  masterVolume: 0.8,
  musicVolume: 0.7,
  effectVolume: 0.5,
  noteSpeed: 8,
  inputOffset: 0,
  judgeWindow: {
    perfect: 50,
    good: 120,
  },
  resolution: '1920x1080',
  fullscreen: false,
  showHitEffect: true,
  showCombo: true,
  backgroundDim: 0.3,
};
