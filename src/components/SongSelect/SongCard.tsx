import { useMemo } from 'react';
import { Music, Zap, Clock } from 'lucide-react';
import type { Song } from '../../types/song';
import NeonCard from '../ui/NeonCard';
import { cn, formatTime } from '../../lib/utils';

interface SongCardProps {
  song: Song;
  selected: boolean;
  onClick: () => void;
  bestScore?: number;
}

const SongCard = ({ song, selected, onClick, bestScore }: SongCardProps) => {
  const highestDifficulty = useMemo(() => {
    return song.difficulties.reduce((max, d) => Math.max(max, d.level), 0);
  }, [song.difficulties]);

  const difficultyColor = useMemo(() => {
    if (highestDifficulty <= 5) return 'text-neon-green';
    if (highestDifficulty <= 10) return 'text-neon-cyan';
    if (highestDifficulty <= 15) return 'text-neon-pink';
    return 'text-neon-red';
  }, [highestDifficulty]);

  return (
    <NeonCard
      glowColor={selected ? 'pink' : 'purple'}
      className={cn(
        'cursor-pointer overflow-hidden group',
        selected && 'border-neon-pink shadow-neon-pink scale-[1.02]'
      )}
      onClick={onClick}
    >
      <div className="flex gap-4 p-4">
        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-neon-purple/30 to-neon-pink/30">
          <div className="absolute inset-0 flex items-center justify-center">
            <Music className="w-10 h-10 text-neon-purple/50" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 to-transparent" />
          <div className="absolute bottom-1 right-1">
            <span className={cn('font-display font-bold text-sm', difficultyColor)}>
              Lv.{highestDifficulty}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg text-white truncate group-hover:text-neon-pink transition-colors">
            {song.title}
          </h3>
          <p className="font-body text-gray-400 text-sm mb-2">{song.artist}</p>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-neon-yellow">
              <Zap className="w-4 h-4" />
              <span className="font-display">{song.bpm} BPM</span>
            </div>
            <div className="flex items-center gap-1 text-neon-cyan">
              <Clock className="w-4 h-4" />
              <span className="font-display">{formatTime(song.duration * 1000)}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <span className="font-body">{song.difficulties.length} 难度</span>
            </div>
          </div>

          {bestScore !== undefined && bestScore > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs font-pixel text-gray-500">BEST:</span>
              <span className="font-display font-bold text-neon-green text-glow-green">
                {bestScore.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 px-4 pb-3">
        {song.difficulties.map((diff) => (
          <div
            key={diff.id}
            className={cn(
              'px-2 py-0.5 rounded text-xs font-display',
              diff.keys === 4
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                : 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
            )}
          >
            {diff.name}
            <span className="ml-1 text-gray-400">L{diff.level}</span>
          </div>
        ))}
      </div>
    </NeonCard>
  );
};

export default SongCard;
