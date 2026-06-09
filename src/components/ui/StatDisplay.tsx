import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface StatDisplayProps {
  label: string;
  value: ReactNode;
  color?: 'pink' | 'cyan' | 'purple' | 'green' | 'yellow';
  className?: string;
}

const StatDisplay = ({ label, value, color = 'cyan', className }: StatDisplayProps) => {
  const colorClasses = {
    pink: 'text-neon-pink text-glow-pink',
    cyan: 'text-neon-cyan text-glow-cyan',
    purple: 'text-neon-purple text-glow-purple',
    green: 'text-neon-green text-glow-green',
    yellow: 'text-neon-yellow text-glow-yellow',
  };

  return (
    <div className={cn('text-center', className)}>
      <div className="text-xs font-pixel text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className={cn('font-display font-bold text-2xl', colorClasses[color])}>
        {value}
      </div>
    </div>
  );
};

export default StatDisplay;
