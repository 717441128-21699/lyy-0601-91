export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

export const easeOutQuad = (t: number): number => {
  return t * (2 - t);
};

export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const degToRad = (deg: number): number => {
  return (deg * Math.PI) / 180;
};

export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

export const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};
