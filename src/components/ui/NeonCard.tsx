import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface NeonCardProps extends HTMLAttributes<HTMLDivElement> {
  glowColor?: 'pink' | 'cyan' | 'purple' | 'yellow' | 'red' | 'none';
}

const NeonCard = forwardRef<HTMLDivElement, NeonCardProps>(
  ({ className, glowColor = 'purple', children, ...props }, ref) => {
    const glowStyles = {
      pink: 'hover:shadow-neon-pink hover:border-neon-pink',
      cyan: 'hover:shadow-neon-cyan hover:border-neon-cyan',
      purple: 'hover:shadow-neon-purple hover:border-neon-purple',
      yellow: 'hover:shadow-[0_0_10px_#FFD700,0_0_20px_#FFD700] hover:border-neon-yellow',
      red: 'hover:shadow-[0_0_10px_#FF3B3B,0_0_20px_#FF3B3B] hover:border-neon-red',
      none: '',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-dark-panel/80 border-2 border-dark-border rounded-xl',
          'backdrop-blur-sm transition-all duration-300',
          glowStyles[glowColor],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NeonCard.displayName = 'NeonCard';

export default NeonCard;
