import { cn } from '@/lib/utils';
import { moods } from '@/data/moods';
import { Mood } from '@/types/diary';

interface MoodSelectorProps {
  selectedMood: Mood | null;
  onSelectMood: (mood: Mood) => void;
}

export function MoodSelector({ selectedMood, onSelectMood }: MoodSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-medium text-foreground text-center">
        How are you feeling?
      </h3>
      <div className="flex flex-wrap justify-center gap-3">
        {moods.map((mood) => (
          <button
            key={mood.value}
            onClick={() => onSelectMood(mood.value)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300",
              "hover:scale-105 hover:shadow-soft",
              selectedMood === mood.value
                ? "border-coral bg-coral-light shadow-soft"
                : "border-border bg-card hover:border-coral/50"
            )}
          >
            <span className="text-3xl">{mood.emoji}</span>
            <span className={cn(
              "text-sm font-medium",
              selectedMood === mood.value ? "text-coral" : "text-muted-foreground"
            )}>
              {mood.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
