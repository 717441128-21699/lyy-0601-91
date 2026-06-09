import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variantStyles = {
      primary: 'border-neon-pink hover:shadow-neon-pink text-neon-pink hover:bg-neon-pink/10',
      secondary: 'border-neon-cyan hover:shadow-neon-cyan text-neon-cyan hover:bg-neon-cyan/10',
      danger: 'border-neon-red hover:shadow-[0_0_10px_#FF3B3B,0_0_20px_#FF3B3B] text-neon-red hover:bg-neon-red/10',
      success: 'border-neon-green hover:shadow-[0_0_10px_#00FF88,0_0_20px_#00FF88] text-neon-green hover:bg-neon-green/10',
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'neon-btn',
          'font-display font-bold uppercase tracking-wider',
          'border-2 bg-dark-panel/50',
          'transition-all duration-300 ease-out',
          'hover:scale-105 active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

NeonButton.displayName = 'NeonButton';

export default NeonButton;
