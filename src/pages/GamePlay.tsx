import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameEngine, GameEngineConfig } from '../game/engine';
import { audioSystem } from '../game/audio';
import { RenderConfig } from '../game/renderer';
import GameHUD from '../components/GamePlay/GameHUD';
import { useSongStore } from '../store/songStore';
import { useSettingsStore } from '../store/settingsStore';
import { useGameStore } from '../store/gameStore';
import { getSampleChart } from '../data/sampleSongs';
import { generateId } from '../utils/math';
import type { Score, JudgeEvent } from '../types/song';
import type { GameState, GameStats } from '../types/game';

const GamePlay = () => {
  const navigate = useNavigate();
  const { songId, difficultyId } = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const animationRef = useRef<number | null>(null);

  const { songs, selectedDifficulty, selectDifficulty, saveScore, getBestScore } = useSongStore();
  const { settings } = useSettingsStore();
  const {
    gameState,
    stats,
    currentTime,
    showPauseMenu,
    setGameState,
    setStats,
    setCurrentTime,
    setShowPauseMenu,
    setCurrentChart,
    resetGame,
  } = useGameStore();

  const [countdown, setCountdown] = useState(3);
  const [isReady, setIsReady] = useState(false);

  const song = songs.find((s) => s.id === songId);
  const difficulty = song?.difficulties.find((d) => d.id === difficultyId) || selectedDifficulty;
  const chart = difficulty ? getSampleChart(difficulty.id) : null;

  useEffect(() => {
    if (!song || !difficulty || !chart) {
      navigate('/');
      return;
    }

    selectDifficulty(difficulty);
    setCurrentChart(chart);

    audioSystem.setMasterVolume(settings.masterVolume);
    audioSystem.setMusicVolume(settings.musicVolume);
    audioSystem.setEffectVolume(settings.effectVolume);

    const initEngine = async () => {
      if (!canvasRef.current) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const keys = difficulty.keys as 4 | 6;
      const laneWidth = Math.min(80, width / (keys + 2));

      const renderConfig: RenderConfig = {
        width,
        height,
        keys,
        noteSpeed: settings.noteSpeed * 50,
        judgeLineY: height * 0.8,
        laneWidth,
        noteHeight: 20,
      };

      const engineConfig: GameEngineConfig = {
        renderConfig,
        judgeConfig: {
          perfectWindow: settings.judgeWindow.perfect,
          goodWindow: settings.judgeWindow.good,
        },
        noteSpeed: settings.noteSpeed * 50,
        inputOffset: settings.inputOffset,
      };

      engineRef.current = new GameEngine(canvasRef.current, engineConfig, audioSystem);
      engineRef.current.loadChart(chart);
      engineRef.current.setKeyMapping(
        keys === 4 ? settings.keyMapping4 : settings.keyMapping6
      );
      engineRef.current.setInputOffset(settings.inputOffset);
      engineRef.current.setNoteSpeed(settings.noteSpeed * 50);

      engineRef.current.setOnStateChange((state: GameState) => {
        queueMicrotask(() => {
          setGameState(state);
          if (state === 'finished' || state === 'failed') {
            handleGameEnd(state);
          }
        });
      });

      engineRef.current.setOnStatsChange((newStats: GameStats) => {
        queueMicrotask(() => {
          setStats(newStats);
        });
      });

      engineRef.current.setOnJudge((event: JudgeEvent) => {
        // Track judge events for result curve
      });

      setIsReady(true);
    };

    initEngine();

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [song, difficulty, chart, settings, navigate, selectDifficulty, setGameState, setStats, setCurrentChart]);

  useEffect(() => {
    if (!isReady) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          startGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isReady]);

  const startGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.start();
      startUpdateLoop();
    }
  }, []);

  const startUpdateLoop = useCallback(() => {
    const update = () => {
      if (engineRef.current && gameState === 'playing') {
        setCurrentTime(engineRef.current.getCurrentTime());
      }
      animationRef.current = requestAnimationFrame(update);
    };
    animationRef.current = requestAnimationFrame(update);
  }, [gameState, setCurrentTime]);

  const handleGameEnd = useCallback(
    (state: GameState) => {
      if (!engineRef.current || !song || !difficulty) return;

      const finalStats = engineRef.current.getStats();
      const grade = engineRef.current.getGrade();

      const scoreData: Score = {
        id: generateId(),
        songId: song.id,
        difficultyId: difficulty.id,
        score: finalStats.score,
        maxCombo: finalStats.maxCombo,
        perfect: finalStats.perfect,
        good: finalStats.good,
        miss: finalStats.miss,
        grade,
        timestamp: new Date().toISOString(),
        judgeHistory: finalStats.judgeHistory,
      };

      saveScore(scoreData);

      setTimeout(() => {
        navigate(`/result/${song.id}/${difficulty.id}?state=${state}`);
      }, 1000);
    },
    [song, difficulty, navigate, saveScore]
  );

  const handlePause = useCallback(() => {
    if (engineRef.current && gameState === 'playing') {
      engineRef.current.pause();
      setShowPauseMenu(true);
    }
  }, [gameState, setShowPauseMenu]);

  const handleResume = useCallback(() => {
    if (engineRef.current && gameState === 'paused') {
      engineRef.current.resume();
      setShowPauseMenu(false);
    }
  }, [gameState, setShowPauseMenu]);

  const handleRestart = useCallback(() => {
    setShowPauseMenu(false);
    resetGame();
    if (engineRef.current) {
      engineRef.current.restart();
    }
  }, [setShowPauseMenu, resetGame]);

  const handleQuit = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'Space') {
        if (showPauseMenu) {
          handleResume();
        } else if (gameState === 'playing') {
          handlePause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, showPauseMenu, handlePause, handleResume]);

  useEffect(() => {
    const handleResize = () => {
      if (engineRef.current && canvasRef.current) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        engineRef.current.resize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!song || !difficulty || !chart) {
    return null;
  }

  return (
    <div className="relative w-full h-full bg-dark-bg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="absolute inset-0"
      />

      {countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
          <div className="text-center">
            <div className="font-pixel text-2xl text-neon-cyan mb-4">GET READY</div>
            <div className="font-display font-black text-9xl text-neon-pink text-glow-pink animate-pulse">
              {countdown}
            </div>
          </div>
        </div>
      )}

      <GameHUD
        stats={stats}
        currentTime={currentTime}
        duration={song.duration * 1000}
        title={song.title}
        artist={song.artist}
        onPause={handlePause}
        showPauseMenu={showPauseMenu}
        onResume={handleResume}
        onRestart={handleRestart}
        onQuit={handleQuit}
        isPaused={gameState === 'paused'}
      />

      {gameState === 'failed' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
          <div className="text-center">
            <div className="font-pixel text-6xl text-neon-red text-glow-pink mb-4 glitch" data-text="FAILED">
              FAILED
            </div>
            <div className="font-body text-2xl text-gray-400">能量耗尽...</div>
          </div>
        </div>
      )}

      <div className="crt-overlay" />
    </div>
  );
};

export default GamePlay;
