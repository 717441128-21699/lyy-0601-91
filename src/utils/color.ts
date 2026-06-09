export const COLORS = {
  neonPink: '#FF2D95',
  neonCyan: '#00F5FF',
  neonPurple: '#9D00FF',
  neonGreen: '#00FF88',
  neonYellow: '#FFD700',
  neonRed: '#FF3B3B',
  darkBg: '#0A0A0F',
  darkPanel: '#12121A',
  darkBorder: '#2A2A3A',
  perfect: '#00FF88',
  good: '#00F5FF',
  miss: '#FF3B3B',
} as const;

export const LANE_COLORS = [
  '#FF2D95',
  '#FFD700',
  '#00F5FF',
  '#9D00FF',
  '#00FF88',
  '#FF3B3B',
];

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
};

export const lerpColor = (color1: string, color2: string, t: number): string => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return rgbToHex(
    c1.r + (c2.r - c1.r) * t,
    c1.g + (c2.g - c1.g) * t,
    c1.b + (c2.b - c1.b) * t
  );
};

export const glowColor = (
  ctx: CanvasRenderingContext2D,
  color: string,
  blur: number
): void => {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
};

export const clearGlow = (ctx: CanvasRenderingContext2D): void => {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
};
