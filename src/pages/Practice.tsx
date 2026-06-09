import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Repeat, Gauge, Music, Clock, Target, Zap, Volume2 } from 'lucide-react';
import NeonButton from '../components/ui/NeonButton';
import NeonCard from '../components/ui/NeonCard';
import StatDisplay from '../components/ui/StatDisplay';
import { useSongStore } from '../store/songStore';
import { useGameStore } from '../store/gameStore';
import { cn, formatTime } from '../lib/utils';
import type { Difficulty, PracticeSettings } from '../types/song';

const Practice = () => {
  const navigate = useNavigate();
  const { songId } = useParams<{ songId: string }>();
  const { songs, selectDifficulty, selectedDifficulty } = useSongStore();
  const { setPracticeSettings } = useGameStore();

  const [selectedDiff, setSelectedDiff] = useState<Difficulty | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [speed, setSpeed] = useState(1.0);

  const song = useMemo(() => {
    return songs.find((s) => s.id === songId) || null;
  }, [songs, songId]);

  useEffect(() => {
    if (song) {
      setEndTime(song.duration * 1000);
      if (song.difficulties.length > 0 && !selectedDiff) {
        setSelectedDiff(song.difficulties[0]);
      }
    }
  }, [song, selectedDiff]);

  const waveformData = useMemo(() => {
    if (!song) return [];
    const bars = 100;
    return Array.from({ length: bars }, (_, i) => {
      const baseHeight = 30 + Math.sin(i * 0.3) * 20 + Math.random() * 30;
      const timeInSection = (i / bars) * (endTime - startTime) + startTime;
      const inRange = timeInSection >= startTime && timeInSection <= endTime;
      return {
        height: Math.min(100, Math.max(10, baseHeight)),
        inRange,
      };
    });
  }, [song, startTime, endTime]);

  const handleDifficultySelect = (diff: Difficulty) => {
    setSelectedDiff(diff);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value < endTime) {
      setStartTime(value);
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > startTime) {
      setEndTime(value);
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(parseFloat(e.target.value));
  };

  const handleStartPractice = () => {
    if (!song || !selectedDiff) return;

    selectDifficulty(selectedDiff);

    const settings: PracticeSettings = {
      startTime: startTime,
      endTime: endTime,
      loop: loopEnabled,
      speed: speed,
    };

    setPracticeSettings(settings);
    navigate(`/play/${song.id}/${selectedDiff.id}`);
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 5) return 'green';
    if (level <= 10) return 'cyan';
    if (level <= 15) return 'pink';
    return 'red';
  };

  const getDifficultyBorderClass = (level: number) => {
    if (level <= 5) return 'border-neon-green text-neon-green hover:shadow-[0_0_10px_#00FF88,0_0_20px_#00FF88]';
    if (level <= 10) return 'border-neon-cyan text-neon-cyan hover:shadow-neon-cyan';
    if (level <= 15) return 'border-neon-pink text-neon-pink hover:shadow-neon-pink';
    return 'border-neon-red text-neon-red hover:shadow-[0_0_10px_#FF3B3B,0_0_20px_#FF3B3B]';
  };

  const durationMs = song ? song.duration * 1000 : 0;
  const sectionDuration = endTime - startTime;

  return (
    <div className="relative w-full h-full bg-dark-bg grid-bg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 via-transparent to-neon-green/5" />

      <div className="absolute top-10 right-20 w-40 h-40 rounded-full bg-neon-cyan/10 blur-3xl animate-float" />
      <div className="absolute bottom-10 left-20 w-32 h-32 rounded-full bg-neon-green/10 blur-3xl animate-float" style={{ animationDelay: '1s' }} />

      <div className="relative h-full flex flex-col">
        <header className="flex items-center justify-between px-8 py-4 border-b-2 border-dark-border bg-dark-panel/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <NeonButton variant="secondary" size="sm" onClick={() => navigate('/songs')}>
              <ArrowLeft className="w-4 h-4" />
            </NeonButton>
            <div className="relative">
              <h1 className="font-pixel text-2xl gradient-text glitch" data-text="PRACTICE MODE">
                PRACTICE MODE
              </h1>
              <div className="text-xs font-body text-neon-green mt-1">练习模式</div>
            </div>
          </div>

          {song && (
            <div className="flex items-center gap-6">
              <StatDisplay label="BPM" value={song.bpm} color="yellow" className="px-4" />
              <StatDisplay
                label="总时长"
                value={formatTime(durationMs)}
                color="cyan"
                className="px-4"
              />
              <StatDisplay
                label="练习段落"
                value={formatTime(sectionDuration)}
                color="pink"
                className="px-4"
              />
            </div>
          )}
        </header>

        {song ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-1/3 p-6 border-r-2 border-dark-border overflow-y-auto">
              <div className="relative aspect-video rounded-xl overflow-hidden mb-6 bg-gradient-to-br from-neon-cyan/40 via-neon-purple/20 to-neon-green/40">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music className="w-20 h-20 text-white/20" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h2 className="font-display font-bold text-2xl text-white text-glow-cyan">
                    {song.title}
                  </h2>
                  <p className="font-body text-neon-pink">{song.artist}</p>
                </div>
              </div>

              <h3 className="font-pixel text-sm text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-neon-purple" />
                难度选择
              </h3>

              <div className="space-y-3 mb-6">
                {song.difficulties.map((diff) => {
                  const color = getDifficultyColor(diff.level);
                  const borderClass = getDifficultyBorderClass(diff.level);
                  const isSelected = selectedDiff?.id === diff.id;

                  return (
                    <NeonCard
                      key={diff.id}
                      glowColor={color === 'red' ? 'none' : (color as 'pink' | 'cyan' | 'purple')}
                      className={cn(
                        'p-4 cursor-pointer transition-all',
                        isSelected &&
                          `bg-neon-${color}/10 ${borderClass} shadow-${color === 'green' ? '[0_0_10px_#00FF88,0_0_20px_#00FF88]' : color === 'red' ? '[0_0_10px_#FF3B3B,0_0_20px_#FF3B3B]' : `neon-${color}`}`
                      )}
                      onClick={() => handleDifficultySelect(diff)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-12 h-12 rounded-lg flex items-center justify-center font-display font-bold',
                              diff.keys === 4 ? 'bg-neon-cyan/20' : 'bg-neon-purple/20'
                            )}
                          >
                            {diff.keys}K
                          </div>
                          <div>
                            <div className="font-display font-bold">{diff.name}</div>
                            <div className="text-xs font-body text-gray-500">
                              {diff.noteCount} 音符
                            </div>
                          </div>
                        </div>
                        <div
                          className={cn(
                            'font-display font-bold text-2xl',
                            color === 'green' && 'text-neon-green text-glow-green',
                            color === 'cyan' && 'text-neon-cyan text-glow-cyan',
                            color === 'pink' && 'text-neon-pink text-glow-pink',
                            color === 'red' && 'text-neon-red'
                          )}
                        >
                          Lv.{diff.level}
                        </div>
                      </div>
                    </NeonCard>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatDisplay
                  label="开始时间"
                  value={formatTime(startTime)}
                  color="cyan"
                />
                <StatDisplay
                  label="结束时间"
                  value={formatTime(endTime)}
                  color="pink"
                />
              </div>
            </div>

            <div className="w-2/3 p-6 overflow-y-auto">
              <NeonCard glowColor="cyan" className="p-6 mb-6">
                <h3 className="font-pixel text-sm text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neon-cyan" />
                  段落选择器
                </h3>

                <div className="mb-8">
                  <div className="relative h-32 bg-dark-panel rounded-lg overflow-hidden mb-4">
                    <div className="absolute inset-0 flex items-end justify-around px-2 pb-2">
                      {waveformData.map((bar, i) => (
                        <div
                          key={i}
                          className={cn(
                            'w-1 rounded-t transition-all duration-200',
                            bar.inRange
                              ? 'bg-gradient-to-t from-neon-cyan to-neon-green'
                              : 'bg-gray-700/50'
                          )}
                          style={{
                            height: `${bar.height}%`,
                            boxShadow: bar.inRange ? '0 0 5px currentColor' : 'none',
                          }}
                        />
                      ))}
                    </div>

                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-neon-pink"
                      style={{
                        left: `${(startTime / durationMs) * 100}%`,
                        boxShadow: '0 0 10px #FF2D95',
                      }}
                    >
                      <div className="absolute -top-1 -left-2 w-5 h-5 bg-neon-pink rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    </div>

                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-neon-green"
                      style={{
                        left: `${(endTime / durationMs) * 100}%`,
                        boxShadow: '0 0 10px #00FF88',
                      }}
                    >
                      <div className="absolute -top-1 -left-2 w-5 h-5 bg-neon-green rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    </div>

                    <div
                      className="absolute top-0 bottom-0 bg-gradient-to-r from-neon-cyan/20 to-neon-green/20"
                      style={{
                        left: `${(startTime / durationMs) * 100}%`,
                        width: `${((endTime - startTime) / durationMs) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-pixel text-neon-pink mb-2">
                        <Clock className="w-4 h-4" />
                        开始时间
                      </label>
                      <input
                        type="range"
                        min="0"
                        max={durationMs}
                        step="100"
                        value={startTime}
                        onChange={handleStartTimeChange}
                        className="w-full"
                      />
                      <div className="flex justify-between mt-1 text-xs font-body text-gray-500">
                        <span>0:00</span>
                        <span className="text-neon-pink">{formatTime(startTime)}</span>
                        <span>{formatTime(durationMs)}</span>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-pixel text-neon-green mb-2">
                        <Clock className="w-4 h-4" />
                        结束时间
                      </label>
                      <input
                        type="range"
                        min="0"
                        max={durationMs}
                        step="100"
                        value={endTime}
                        onChange={handleEndTimeChange}
                        className="w-full"
                      />
                      <div className="flex justify-between mt-1 text-xs font-body text-gray-500">
                        <span>0:00</span>
                        <span className="text-neon-green">{formatTime(endTime)}</span>
                        <span>{formatTime(durationMs)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-pixel text-gray-400">快捷选择</span>
                  <div className="flex gap-2">
                    <NeonButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setStartTime(0);
                        setEndTime(durationMs);
                      }}
                    >
                      全曲
                    </NeonButton>
                    <NeonButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const third = durationMs / 3;
                        setStartTime(third);
                        setEndTime(third * 2);
                      }}
                    >
                      中段
                    </NeonButton>
                    <NeonButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const quarter = durationMs / 4;
                        setStartTime(quarter * 2);
                        setEndTime(quarter * 3);
                      }}
                    >
                      高潮
                    </NeonButton>
                  </div>
                </div>
              </NeonCard>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <NeonCard glowColor="purple" className="p-6">
                  <h3 className="font-pixel text-sm text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-neon-purple" />
                    循环练习
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className="font-body text-gray-300">启用循环</span>
                    <button
                      onClick={() => setLoopEnabled(!loopEnabled)}
                      className={cn(
                        'w-16 h-8 rounded-full transition-all duration-300 relative',
                        loopEnabled
                          ? 'bg-neon-purple shadow-[0_0_10px_#9D00FF,0_0_20px_#9D00FF]'
                          : 'bg-dark-border'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300',
                          loopEnabled ? 'left-9' : 'left-1'
                        )}
                      />
                    </button>
                  </div>

                  {loopEnabled && (
                    <p className="mt-3 text-sm font-body text-neon-purple">
                      段落结束后将自动循环重放
                    </p>
                  )}
                </NeonCard>

                <NeonCard glowColor="purple" className="p-6">
                  <h3 className="font-pixel text-sm text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-neon-yellow" />
                    速度调节
                  </h3>

                  <div className="mb-4">
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={speed}
                      onChange={handleSpeedChange}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-body text-gray-400">当前速度</span>
                    <span
                      className={cn(
                        'font-display font-bold text-2xl',
                        speed < 1 && 'text-neon-cyan',
                        speed === 1 && 'text-neon-green',
                        speed > 1 && 'text-neon-yellow'
                      )}
                    >
                      {speed.toFixed(1)}x
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        className={cn(
                          'flex-1 py-2 rounded font-display text-sm transition-all',
                          speed === s
                            ? 'bg-neon-yellow text-dark-bg font-bold'
                            : 'bg-dark-panel text-gray-400 hover:bg-dark-border'
                        )}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </NeonCard>
              </div>

              <NeonCard glowColor="pink" className="p-6 mb-6">
                <h3 className="font-pixel text-sm text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-neon-pink" />
                  练习设置概览
                </h3>

                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-dark-panel">
                    <div className="text-xs font-pixel text-gray-500 mb-1">难度</div>
                    <div className="font-display font-bold text-neon-cyan">
                      {selectedDiff?.name || '-'}
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-dark-panel">
                    <div className="text-xs font-pixel text-gray-500 mb-1">段落</div>
                    <div className="font-display font-bold text-neon-pink">
                      {formatTime(sectionDuration)}
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-dark-panel">
                    <div className="text-xs font-pixel text-gray-500 mb-1">循环</div>
                    <div
                      className={cn(
                        'font-display font-bold',
                        loopEnabled ? 'text-neon-purple' : 'text-gray-500'
                      )}
                    >
                      {loopEnabled ? '开启' : '关闭'}
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-dark-panel">
                    <div className="text-xs font-pixel text-gray-500 mb-1">速度</div>
                    <div className="font-display font-bold text-neon-yellow">
                      {speed.toFixed(1)}x
                    </div>
                  </div>
                </div>
              </NeonCard>

              <NeonButton
                variant="primary"
                size="lg"
                className="w-full flex items-center justify-center gap-3 text-xl"
                onClick={handleStartPractice}
                disabled={!selectedDiff}
              >
                <Play className="w-6 h-6" />
                开始练习
              </NeonButton>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="font-body text-gray-500 text-lg">未找到歌曲</p>
              <p className="font-body text-gray-600 text-sm mt-2">
                <button
                  onClick={() => navigate('/songs')}
                  className="text-neon-cyan hover:underline"
                >
                  返回选歌界面
                </button>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="crt-overlay" />
    </div>
  );
};

export default Practice;
