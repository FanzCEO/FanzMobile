import { cn } from '@/lib/utils';

type OrbState = 'idle' | 'listening' | 'processing' | 'success' | 'error';

interface AIOrbProps {
  state?: OrbState;
  size?: 'sm' | 'md' | 'lg';
}

export function AIOrb({ state = 'idle', size = 'lg' }: AIOrbProps) {
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  const stateClasses = {
    idle: 'orb-pulse',
    listening: 'orb-pulse orb-rotate',
    processing: 'orb-rotate',
    success: '',
    error: '',
  };

  const stateColors = {
    idle: 'from-primary via-secondary to-accent',
    listening: 'from-accent via-primary to-secondary',
    processing: 'from-secondary via-accent to-primary',
    success: 'from-green-500 via-green-400 to-green-300',
    error: 'from-destructive via-red-500 to-red-400',
  };

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={cn(
          'rounded-full bg-gradient-to-br',
          sizeClasses[size],
          stateClasses[state],
          stateColors[state],
          'shadow-2xl'
        )}
        style={{
          boxShadow: '0 0 60px rgba(45, 111, 255, 0.5), 0 0 100px rgba(164, 92, 255, 0.3)',
        }}
      >
        <img
          src="/assets/ai-orb-idle.png"
          alt="AI Orb"
          className="w-full h-full object-cover rounded-full opacity-80"
        />
      </div>
      
      {/* Outer ring */}
      <div
        className={cn(
          'absolute rounded-full border-2 border-white/20',
          size === 'lg' ? 'w-48 h-48' : size === 'md' ? 'w-40 h-40' : 'w-28 h-28',
          state === 'processing' && 'orb-rotate'
        )}
      />
    </div>
  );
}