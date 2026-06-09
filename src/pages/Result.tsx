import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { RotateCcw, Home, SkipForward, Trophy, Music, Zap, Target, TrendingUp, Award } from 'lucide-react';
import NeonButton from '../components/ui/NeonButton';
import NeonCard from '../components/ui/NeonCard';
import StatDisplay from '../components/ui/StatDisplay';
import ProgressBar from '../components/ui/ProgressBar';
import { useSongStore } from '../store/songStore';
import { useGameStore } from '../store/gameStore';
import { cn, formatTime } from '../lib/utils';
import type { Score, JudgeEvent, Song, Difficulty } from '../types/song';
import type { GameState } from '../types/game';

const GRADE_COLORS: Record<string, { color: string; glow: string }> = {
  S: { color: 'text-neon-yellow', glow: 'text-glow-yellow' },
  A: { color: 'text-neon-green', glow: 'text-glow-green' },
  B: { color: 'text-neon-cyan', glow: 'text-glow-cyan' },
  C: { color: 'text-neon-purple', glow: 'text-glow-purple' },
  D: { color: 'text-neon-pink', glow: 'text-glow-pink' },
  F: { color: 'text-neon-red', glow: 'text-glow-pink' },
};

const JUDGE_COLORS = {
  perfect: '#00FF88',
  good: '#00F5FF',
  miss: '#FF3B3B',
};

const Result = () => {
  const navigate = useNavigate();
  const { songId, difficultyId } = useParams<{ songId: string; difficultyId: string }>();
  const [searchParams] = useSearchParams();
  const gameStateParam = searchParams.get('state') as GameState;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const { songs, getBestScore, selectSong, selectDifficulty } = useSongStore();
  const { stats } = useGameStore();

  const [currentScore, setCurrentScore] = useState<Score | null>(null);
  const [bestScore, setBestScore] = useState<Score | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  const song = useMemo(() => songs.find((s) => s.id === songId) as Song | undefined, [songs, songId]);
  const difficulty = useMemo(
    () => song?.difficulties.find((d) => d.id === difficultyId) as Difficulty | undefined,
    [song, difficultyId]
  );

  useEffect(() => {
    if (!songId || !difficultyId) {
      navigate('/');
      return;
    }

    if (song && difficulty) {
      selectSong(song);
      selectDifficulty(difficulty);
    }

    const best = getBestScore(difficultyId);
    setBestScore(best);

    if (stats.score > 0) {
      const scoreData: Score = {
        id: `${songId}-${difficultyId}-${Date.now()}`,
        songId,
        difficultyId,
        score: stats.score,
        maxCombo: stats.maxCombo,
        perfect: stats.perfect,
        good: stats.good,
        miss: stats.miss,
        grade: calculateGrade(stats.perfect, stats.good, stats.miss),
        timestamp: new Date().toISOString(),
        judgeHistory: stats.judgeHistory,
      };
      setCurrentScore(scoreData);
      setIsNewBest(!best || stats.score > best.score);
    } else if (best) {
      setCurrentScore(best);
    }
  }, [songId, difficultyId, stats, song, difficulty, navigate, selectSong, selectDifficulty, getBestScore]);

  useEffect(() => {
    if (!currentScore?.judgeHistory || !canvasRef.current || !song) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const duration = song.duration * 1000;

    let animationProgress = 0;
    const animationDuration = 1500;
    const startTime = performance.now();

    const drawJudgeCurve = (progress: number) => {
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(42, 42, 58, 0.5)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }

      for (let i = 0; i <= 5; i++) {
        const x = padding + (chartWidth / 5) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }

      const centerY = padding + chartHeight / 2;
      ctx.strokeStyle = 'rgba(157, 0, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, centerY);
      ctx.lineTo(width - padding, centerY);
      ctx.stroke();

      ctx.fillStyle = '#666';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      for (let i = 0; i <= 5; i++) {
        const x = padding + (chartWidth / 5) * i;
        const time = Math.round((duration / 5) * i / 1000);
        ctx.fillText(`${time}s`, x, height - 10);
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = JUDGE_COLORS.perfect;
      ctx.fillText('+120', padding - 10, padding + 20);
      ctx.fillStyle = '#888';
      ctx.fillText('0', padding - 10, centerY);
      ctx.fillStyle = JUDGE_COLORS.miss;
      ctx.fillText('-120', padding - 10, height - padding - 10);

      const visibleCount = Math.floor(currentScore.judgeHistory!.length * progress);
      const visibleEvents = currentScore.judgeHistory!.slice(0, visibleCount);

      visibleEvents.forEach((event: JudgeEvent) => {
        const x = padding + (event.time / duration) * chartWidth;
        const normalizedDelta = Math.max(-1, Math.min(1, event.delta / 120));
        const y = centerY - normalizedDelta * (chartHeight / 2);

        const color = event.judgement === 'perfect'
          ? JUDGE_COLORS.perfect
          : event.judgement === 'good'
          ? JUDGE_COLORS.good
          : JUDGE_COLORS.miss;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      const legendX = width - padding - 120;
      const legendY = padding + 20;
      const legendItems = [
        { label: 'PERFECT', color: JUDGE_COLORS.perfect },
        { label: 'GOOD', color: JUDGE_COLORS.good },
        { label: 'MISS', color: JUDGE_COLORS.miss },
      ];

      legendItems.forEach((item, i) => {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(legendX, legendY + i * 20, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(item.label, legendX + 15, legendY + i * 20 + 4);
      });
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      animationProgress = Math.min(1, elapsed / animationDuration);
      const easedProgress = 1 - Math.pow(1 - animationProgress, 3);

      drawJudgeCurve(easedProgress);

      if (animationProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentScore?.judgeHistory, song]);

  const calculateGrade = (perfect: number, good: number, miss: number): string => {
    const total = perfect + good + miss;
    if (total === 0) return 'F';

    const accuracy = (perfect + good * 0.5) / total;

    if (accuracy >= 0.98) return 'S';
    if (accuracy >= 0.95) return 'A';
    if (accuracy >= 0.90) return 'B';
    if (accuracy >= 0.80) return 'C';
    if (accuracy >= 0.60) return 'D';
    return 'F';
  };

  const calculateAccuracy = (perfect: number, good: number, miss: number): number => {
    const total = perfect + good + miss;
    if (total === 0) return 0;
    return ((perfect + good * 0.5) / total) * 100;
  };

  const handleRestart = () => {
    if (songId && difficultyId) {
      navigate(`/play/${songId}/${difficultyId}`);
    }
  };

  const handleBackToSelect = () => {
    navigate('/songs');
  };

  const handleNextSong = () => {
    const currentIndex = songs.findIndex((s) => s.id === songId);
    const nextIndex = (currentIndex + 1) % songs.length;
    const nextSong = songs[nextIndex];
    if (nextSong && nextSong.difficulties.length > 0) {
      const nextDiff = nextSong.difficulties.find((d) => d.level === difficulty?.level) || nextSong.difficulties[0];
      navigate(`/play/${nextSong.id}/${nextDiff.id}`);
    }
  };

  const isFailed = gameStateParam === 'failed';
  const displayScore = currentScore || bestScore;

  if (!song || !difficulty || !displayScore) {
    return (
      <div className="relative w-full h-full bg-dark-bg flex items-center justify-center">
        <div className="font-pixel text-neon-cyan text-glow-cyan animate-pulse">LOADING...</div>
        <div className="crt-overlay" />
      </div>
    );
  }

  const totalNotes = displayScore.perfect + displayScore.good + displayScore.miss;
  const accuracy = calculateAccuracy(displayScore.perfect, displayScore.good, displayScore.miss);
  const gradeStyle = GRADE_COLORS[displayScore.grade] || GRADE_COLORS.F;

  const perfectPercent = totalNotes > 0 ? (displayScore.perfect / totalNotes) * 100 : 0;
  const goodPercent = totalNotes > 0 ? (displayScore.good / totalNotes) * 100 : 0;
  const missPercent = totalNotes > 0 ? (displayScore.miss / totalNotes) * 100 : 0;

  return (
    <div className="relative w-full h-full bg-dark-bg grid-bg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/10 via-transparent to-neon-pink/10" />

      <div className="relative h-full flex flex-col p-8 overflow-y-auto">
        <header className="text-center mb-8">
          <h1 className="font-pixel text-3xl gradient-text glitch mb-2" data-text="STAGE CLEAR">
            {isFailed ? 'STAGE FAILED' : 'STAGE CLEAR'}
          </h1>
          <div className="font-body text-xl text-gray-400">
            {song.title} - {difficulty.name}
          </div>
          <div className="font-body text-sm text-neon-cyan mt-1">
            {song.artist} · Lv.{difficulty.level} · {difficulty.keys}K
          </div>
        </header>

        <div className="flex-1 flex gap-8 max-w-7xl mx-auto w-full">
          <div className="w-1/2 space-y-6">
            <NeonCard glowColor="purple" className="p-8 text-center">
              {isNewBest && !isFailed && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-neon-yellow text-dark-bg font-pixel text-xs rounded-full animate-bounce">
                  NEW RECORD!
                </div>
              )}

              <div className="mb-6">
                <div className="font-pixel text-sm text-gray-400 mb-2">
                  {isFailed ? 'FAILED' : 'CLEARED'}
                </div>
                <div
                  className={cn(
                    'font-display font-black text-9xl',
                    gradeStyle.color,
                    gradeStyle.glow,
                    'animate-pulse-glow'
                  )}
                >
                  {displayScore.grade}
                </div>
              </div>

              <div className="mb-6">
                <div className="font-pixel text-xs text-gray-400 mb-1">FINAL SCORE</div>
                <div className="font-display font-black text-5xl text-neon-cyan text-glow-cyan">
                  {displayScore.score.toLocaleString()}
                </div>
                {bestScore && bestScore.score !== displayScore.score && (
                  <div className="font-body text-sm text-gray-500 mt-1">
                    最佳: {bestScore.score.toLocaleString()}
                    {displayScore.score > bestScore.score ? (
                      <span className="text-neon-green ml-2">↑ {displayScore.score - bestScore.score}</span>
                    ) : (
                      <span className="text-neon-red ml-2">↓ {bestScore.score - displayScore.score}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <StatDisplay
                  label="最大连击"
                  value={
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="w-6 h-6 text-neon-yellow" />
                      <span>{displayScore.maxCombo}</span>
                    </div>
                  }
                  color="yellow"
                />
                <StatDisplay
                  label="准确率"
                  value={`${accuracy.toFixed(2)}%`}
                  color="green"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-pixel text-xs text-neon-green flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      PERFECT
                    </span>
                    <span className="font-display text-neon-green">
                      {displayScore.perfect} ({perfectPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <ProgressBar value={displayScore.perfect} max={totalNotes} color="green" height={6} />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-pixel text-xs text-neon-cyan flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      GOOD
                    </span>
                    <span className="font-display text-neon-cyan">
                      {displayScore.good} ({goodPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <ProgressBar value={displayScore.good} max={totalNotes} color="cyan" height={6} />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-pixel text-xs text-neon-red flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      MISS
                    </span>
                    <span className="font-display text-neon-red">
                      {displayScore.miss} ({missPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <ProgressBar value={displayScore.miss} max={totalNotes} color="red" height={6} />
                </div>
              </div>
            </NeonCard>

            {bestScore && (
              <NeonCard glowColor="cyan" className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="w-6 h-6 text-neon-yellow" />
                  <h3 className="font-pixel text-sm text-neon-cyan">个人最佳记录</h3>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <StatDisplay label="分数" value={bestScore.score.toLocaleString()} color="cyan" className="text-sm" />
                  <StatDisplay label="评级" value={bestScore.grade} color="yellow" className="text-sm" />
                  <StatDisplay label="连击" value={bestScore.maxCombo} color="pink" className="text-sm" />
                  <StatDisplay
                    label="准确率"
                    value={`${calculateAccuracy(bestScore.perfect, bestScore.good, bestScore.miss).toFixed(1)}%`}
                    color="green"
                    className="text-sm"
                  />
                </div>
              </NeonCard>
            )}
          </div>

          <div className="w-1/2 space-y-6">
            <NeonCard glowColor="pink" className="p-6 h-80">
              <div className="flex items-center gap-3 mb-4">
                <Music className="w-6 h-6 text-neon-pink" />
                <h3 className="font-pixel text-sm text-neon-pink">判定分布曲线</h3>
              </div>
              <canvas
                ref={canvasRef}
                className="w-full h-56 bg-dark-bg/50 rounded-lg"
                style={{ imageRendering: 'pixelated' }}
              />
            </NeonCard>

            <NeonCard glowColor="none" className="p-6">
              <h3 className="font-pixel text-sm text-gray-400 mb-4 text-center">演奏统计</h3>
              <div className="grid grid-cols-3 gap-4">
                <StatDisplay
                  label="总音符"
                  value={totalNotes}
                  color="purple"
                />
                <StatDisplay
                  label="歌曲时长"
                  value={formatTime(song.duration * 1000)}
                  color="cyan"
                />
                <StatDisplay
                  label="BPM"
                  value={song.bpm}
                  color="yellow"
                />
              </div>
            </NeonCard>

            <div className="grid grid-cols-3 gap-4">
              <NeonButton
                variant="secondary"
                size="lg"
                onClick={handleBackToSelect}
                className="flex flex-col items-center gap-2 py-6"
              >
                <Home className="w-8 h-8" />
                <span className="text-sm">选歌</span>
              </NeonButton>

              <NeonButton
                variant="primary"
                size="lg"
                onClick={handleRestart}
                className="flex flex-col items-center gap-2 py-6"
              >
                <RotateCcw className="w-8 h-8" />
                <span className="text-sm">重玩</span>
              </NeonButton>

              <NeonButton
                variant="success"
                size="lg"
                onClick={handleNextSong}
                className="flex flex-col items-center gap-2 py-6"
              >
                <SkipForward className="w-8 h-8" />
                <span className="text-sm">下一首</span>
              </NeonButton>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center">
          <div className="font-pixel text-xs text-gray-600">
            PRESS ENTER TO RESTART · ESC TO EXIT
          </div>
        </footer>
      </div>

      <div className="crt-overlay" />

      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-30"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.3) 2px, rgba(0, 0, 0, 0.3) 4px)',
          animation: 'scanline 8s linear infinite',
        }}
      />
    </div>
  );
};

export default Result;
