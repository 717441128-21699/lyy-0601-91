import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Music, Gauge, Keyboard, Zap, Star } from 'lucide-react';
import NeonButton from '../components/ui/NeonButton';
import NeonCard from '../components/ui/NeonCard';
import StatDisplay from '../components/ui/StatDisplay';
import { useSongStore } from '../store/songStore';
import { useSettingsStore } from '../store/settingsStore';
import { useGameStore } from '../store/gameStore';
import { cn, formatTime } from '../lib/utils';
import { getSampleChart } from '../data/sampleSongs';
import type { Difficulty } from '../types/song';

const DifficultySelect = () => {
  const navigate = useNavigate();
  const { songId } = useParams();
  const { songs, selectDifficulty, getBestScore } = useSongStore();
  const { settings } = useSettingsStore();
  const { resetGame } = useGameStore();

  const [selectedKeys, setSelectedKeys] = useState<4 | 6>(4);

  const song = useMemo(() => songs.find((s) => s.id === songId), [songs, songId]);
  const filteredDifficulties = useMemo(
    () => song?.difficulties.filter((d) => d.keys === selectedKeys) || [],
    [song, selectedKeys]
  );

  useEffect(() => {
    if (!song) {
      navigate('/');
    }
  }, [song, navigate]);

  if (!song) return null;

  const handleDifficultySelect = (diff: Difficulty) => {
    selectDifficulty(diff);
    resetGame();
    const chart = getSampleChart(diff.id);
    if (chart) {
      navigate(`/play/${song.id}/${diff.id}`);
    }
  };

  const difficultyColor = (level: number) => {
    if (level <= 5) return 'border-neon-green text-neon-green hover:bg-neon-green/10';
    if (level <= 10) return 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10';
    if (level <= 15) return 'border-neon-pink text-neon-pink hover:bg-neon-pink/10';
    return 'border-neon-red text-neon-red hover:bg-neon-red/10';
  };

  const getDensityStars = (noteCount: number, duration: number) => {
    const density = noteCount / duration;
    if (density < 3) return 1;
    if (density < 5) return 2;
    if (density < 7) return 3;
    if (density < 9) return 4;
    return 5;
  };

  return (
    <div className="relative w-full h-full bg-dark-bg grid-bg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/5 via-transparent to-neon-pink/5" />

      <div className="relative h-full flex flex-col items-center justify-center p-8">
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-neon-cyan transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-body">返回选歌</span>
        </button>

        <div className="text-center mb-8">
          <h1 className="font-pixel text-3xl gradient-text mb-2">选择难度</h1>
          <p className="font-body text-gray-400">选择你要挑战的难度</p>
        </div>

        <div className="w-full max-w-4xl">
          <NeonCard glowColor="cyan" className="p-6 mb-8">
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-neon-purple/40 to-neon-pink/40">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music className="w-16 h-16 text-white/30" />
                </div>
              </div>

              <div className="flex-1">
                <h2 className="font-display font-bold text-3xl text-white mb-2">{song.title}</h2>
                <p className="font-body text-lg text-neon-cyan mb-4">{song.artist}</p>

                <div className="grid grid-cols-4 gap-4">
                  <StatDisplay label="BPM" value={song.bpm} color="yellow" />
                  <StatDisplay
                    label="时长"
                    value={formatTime(song.duration * 1000)}
                    color="cyan"
                  />
                  <StatDisplay
                    label="难度数"
                    value={song.difficulties.length}
                    color="pink"
                  />
                  <StatDisplay
                    label="最高难度"
                    value={`L${Math.max(...song.difficulties.map((d) => d.level))}`}
                    color="purple"
                  />
                </div>
              </div>
            </div>
          </NeonCard>

          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setSelectedKeys(4)}
              className={cn(
                'px-8 py-4 rounded-lg font-display font-bold text-xl transition-all duration-300 border-2',
                selectedKeys === 4
                  ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-neon-cyan'
                  : 'bg-dark-panel border-dark-border text-gray-400 hover:border-neon-cyan/50'
              )}
            >
              <Keyboard className="w-6 h-6 inline-block mr-2" />
              4键模式
            </button>
            <button
              onClick={() => setSelectedKeys(6)}
              className={cn(
                'px-8 py-4 rounded-lg font-display font-bold text-xl transition-all duration-300 border-2',
                selectedKeys === 6
                  ? 'bg-neon-purple/20 border-neon-purple text-neon-purple shadow-neon-purple'
                  : 'bg-dark-panel border-dark-border text-gray-400 hover:border-neon-purple/50'
              )}
            >
              <Keyboard className="w-6 h-6 inline-block mr-2" />
              6键模式
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredDifficulties.map((diff) => {
              const best = getBestScore(diff.id);
              const density = getDensityStars(diff.noteCount, song.duration);
              const chart = getSampleChart(diff.id);

              return (
                <NeonCard
                  key={diff.id}
                  glowColor="purple"
                  className={cn(
                    'cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02]',
                    difficultyColor(diff.level)
                  )}
                  onClick={() => handleDifficultySelect(diff)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="font-pixel text-sm text-gray-400 mb-1">{diff.name}</div>
                        <div className={cn('font-display font-bold text-5xl', difficultyColor(diff.level).split(' ')[1])}>
                          Lv.{diff.level}
                        </div>
                      </div>
                      <div
                        className={cn(
                          'w-16 h-16 rounded-lg flex items-center justify-center font-display font-bold text-2xl',
                          selectedKeys === 4 ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-neon-purple/20 text-neon-purple'
                        )}
                      >
                        {diff.keys}K
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-body text-gray-400 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-neon-yellow" />
                          音符密度
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={cn(
                                'w-4 h-4',
                                i <= density ? 'text-neon-yellow fill-neon-yellow' : 'text-gray-600'
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="font-body text-gray-400">音符数量</span>
                        <span className="font-display text-neon-cyan">{diff.noteCount}</span>
                      </div>

                      {chart && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-body text-gray-400">谱面版本</span>
                          <span className="font-display text-neon-purple">v{chart.version}</span>
                        </div>
                      )}
                    </div>

                    {best && (
                      <div className="pt-4 border-t border-dark-border">
                        <div className="text-xs font-pixel text-gray-500 mb-1">个人最佳</div>
                        <div className="font-display font-bold text-neon-green text-xl text-glow-green">
                          {best.score.toLocaleString()}
                        </div>
                        <div className="text-xs font-body text-gray-500 mt-1">
                          评级: {best.grade} | 连击: {best.maxCombo}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-6 pb-6">
                    <NeonButton variant="primary" className="w-full">
                      开始挑战
                    </NeonButton>
                  </div>
                </NeonCard>
              );
            })}
          </div>

          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-4 text-sm font-body text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-green" />
                <span>简单 Lv.1-5</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-cyan" />
                <span>普通 Lv.6-10</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-pink" />
                <span>困难 Lv.11-15</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-red" />
                <span>专家 Lv.16+</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="crt-overlay" />
    </div>
  );
};

export default DifficultySelect;
