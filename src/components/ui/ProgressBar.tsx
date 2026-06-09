import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'pink' | 'cyan' | 'purple' | 'green' | 'red' | 'yellow' | 'gradient';
  showLabel?: boolean;
  label?: string;
  className?: string;
  height?: number;
}

const ProgressBar = ({
  value,
  max = 100,
  color = 'gradient',
  showLabel = false,
  label,
  className,
  height = 8,
}: ProgressBarProps) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  const colorStyles = {
    pink: 'bg-neon-pink',
    cyan: 'bg-neon-cyan',
    purple: 'bg-neon-purple',
    green: 'bg-neon-green',
    red: 'bg-neon-red',
    yellow: 'bg-neon-yellow',
    gradient: 'bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-body text-gray-400">{label}</span>
          <span className="text-sm font-display text-neon-cyan">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className="w-full bg-dark-border rounded-full overflow-hidden"
        style={{ height }}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            colorStyles[color]
          )}
          style={{
            width: `${percentage}%`,
            boxShadow: percentage > 10 ? '0 0 10px currentColor' : 'none',
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
