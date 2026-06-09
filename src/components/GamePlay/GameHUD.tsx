import { Pause, Volume2, X } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import StatDisplay from '../ui/StatDisplay';
import type { GameStats } from '../../types/game';
import { formatNumber, formatTime } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface GameHUDProps {
  stats: GameStats;
  currentTime: number;
  duration: number;
  title: string;
  artist: string;
  onPause: () => void;
  showPauseMenu: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  isPaused: boolean;
}

const GameHUD = ({
  stats,
  currentTime,
  duration,
  title,
  artist,
  onPause,
  showPauseMenu,
  onResume,
  onRestart,
  onQuit,
  isPaused,
}: GameHUDProps) => {
  const progress = (currentTime / duration) * 100;
  const comboDisplay = stats.combo > 0 ? stats.combo.toString() : '';
  const comboScale = Math.min(1 + stats.combo * 0.002, 1.5);

  return (
    <>
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-0 left-0 right-0 p-6 flex items-start justify-between">
          <div className="text-left">
            <div className="font-pixel text-xs text-gray-500 uppercase tracking-wider">Score</div>
            <div className="font-display font-black text-5xl text-white text-glow-cyan">
              {formatNumber(stats.score)}
            </div>
          </div>

          <div className="text-center">
            <div className="font-body text-sm text-gray-400">{title}</div>
            <div className="font-body text-xs text-gray-500">{artist}</div>
          </div>

          <div className="text-right">
            <button
              onClick={onPause}
              className="pointer-events-auto p-2 rounded-lg bg-dark-panel/80 border border-dark-border hover:border-neon-cyan transition-colors"
            >
              <Pause className="w-6 h-6 text-neon-cyan" />
            </button>
          </div>
        </div>

        <div className="absolute top-6 right-24 text-right">
          <StatDisplay label="Perfect" value={stats.perfect} color="green" className="mb-2" />
          <StatDisplay label="Good" value={stats.good} color="cyan" className="mb-2" />
          <StatDisplay label="Miss" value={stats.miss} color="pink" />
        </div>

        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          {comboDisplay && (
            <div
              className="transition-transform duration-150"
              style={{ transform: `scale(${comboScale})` }}
            >
              <div className="font-pixel text-sm text-neon-yellow uppercase tracking-widest mb-1">
                Combo
              </div>
              <div className="font-display font-black text-8xl text-neon-yellow text-glow-yellow">
                {comboDisplay}
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="font-display text-sm text-neon-cyan">{formatTime(currentTime)}</div>
            <div className="flex-1">
              <ProgressBar value={progress} color="gradient" height={4} />
            </div>
            <div className="font-display text-sm text-gray-500">{formatTime(duration)}</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <ProgressBar
                value={stats.energy}
                color={stats.energy < 30 ? 'red' : stats.energy < 60 ? 'yellow' : 'green'}
                showLabel
                label="GROOVE"
                height={12}
              />
            </div>
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-gray-500" />
              <span className="font-display text-sm text-gray-500">MAX</span>
            </div>
          </div>
        </div>
      </div>

      {showPauseMenu && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-dark-panel border-2 border-neon-purple rounded-2xl p-8 max-w-md w-full mx-4 shadow-neon-purple">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-3xl text-neon-purple">游戏暂停</h2>
              <button
                onClick={onResume}
                className="p-2 rounded-lg hover:bg-dark-border transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatDisplay label="分数" value={formatNumber(stats.score)} color="cyan" />
              <StatDisplay label="连击" value={stats.maxCombo} color="yellow" />
            </div>

            <div className="space-y-3">
              <button
                onClick={onResume}
                className={cn(
                  'w-full py-4 rounded-lg font-display font-bold text-xl transition-all',
                  'bg-neon-green/20 border-2 border-neon-green text-neon-green',
                  'hover:bg-neon-green/30 hover:shadow-[0_0_20px_#00FF88]'
                )}
              >
                继续游戏
              </button>

              <button
                onClick={onRestart}
                className={cn(
                  'w-full py-4 rounded-lg font-display font-bold text-xl transition-all',
                  'bg-neon-cyan/20 border-2 border-neon-cyan text-neon-cyan',
                  'hover:bg-neon-cyan/30 hover:shadow-[0_0_20px_#00F5FF]'
                )}
              >
                重新开始
              </button>

              <button
                onClick={onQuit}
                className={cn(
                  'w-full py-4 rounded-lg font-display font-bold text-xl transition-all',
                  'bg-neon-red/20 border-2 border-neon-red text-neon-red',
                  'hover:bg-neon-red/30 hover:shadow-[0_0_20px_#FF3B3B]'
                )}
              >
                退出游戏
              </button>
            </div>

            <div className="mt-6 text-center font-body text-sm text-gray-500">
              按 ESC 或 SPACE 继续游戏
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameHUD;
