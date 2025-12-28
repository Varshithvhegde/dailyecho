import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakCounterProps {
  streak: number;
  className?: string;
}

export function StreakCounter({ streak, className }: StreakCounterProps) {
  const hasStreak = streak > 0;
  
  return (
    <div className={cn(
      "flex items-center gap-3 px-5 py-3 rounded-2xl",
      hasStreak ? "bg-coral-light" : "bg-muted",
      className
    )}>
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-xl",
        hasStreak ? "bg-coral text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
      )}>
        <Flame className={cn("w-5 h-5", hasStreak && "animate-pulse")} />
      </div>
      <div>
        <p className={cn(
          "text-2xl font-display font-bold",
          hasStreak ? "text-coral" : "text-muted-foreground"
        )}>
          {streak}
        </p>
        <p className="text-sm text-muted-foreground">
          {streak === 1 ? 'day streak' : 'days streak'}
        </p>
      </div>
    </div>
  );
}
