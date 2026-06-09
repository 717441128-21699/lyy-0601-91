/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        neon: {
          pink: '#FF2D95',
          cyan: '#00F5FF',
          purple: '#9D00FF',
          green: '#00FF88',
          yellow: '#FFD700',
          red: '#FF3B3B',
        },
        dark: {
          bg: '#0A0A0F',
          panel: '#12121A',
          border: '#2A2A3A',
        },
        judge: {
          perfect: '#00FF88',
          good: '#00F5FF',
          miss: '#FF3B3B',
        },
      },
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'monospace'],
        'display': ['Orbitron', 'sans-serif'],
        'body': ['VT323', 'monospace'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-pink': 'glowPink 2s ease-in-out infinite alternate',
        'glow-cyan': 'glowCyan 2s ease-in-out infinite alternate',
        'pulse-glow': 'pulseGlow 1.5s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'glitch': 'glitch 1s infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '100%': { boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor' },
        },
        glowPink: {
          '0%': { boxShadow: '0 0 5px #FF2D95, 0 0 10px #FF2D95' },
          '100%': { boxShadow: '0 0 20px #FF2D95, 0 0 40px #FF2D95' },
        },
        glowCyan: {
          '0%': { boxShadow: '0 0 5px #00F5FF, 0 0 10px #00F5FF' },
          '100%': { boxShadow: '0 0 20px #00F5FF, 0 0 40px #00F5FF' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
        scanline: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
      },
      boxShadow: {
        'neon-pink': '0 0 10px #FF2D95, 0 0 20px #FF2D95, 0 0 30px #FF2D95',
        'neon-cyan': '0 0 10px #00F5FF, 0 0 20px #00F5FF, 0 0 30px #00F5FF',
        'neon-purple': '0 0 10px #9D00FF, 0 0 20px #9D00FF, 0 0 30px #9D00FF',
      },
    },
  },
  plugins: [],
};
