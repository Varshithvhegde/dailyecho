import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DiaryEntry } from '@/types/diary';
import { getMoodByValue } from '@/data/moods';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  entries: DiaryEntry[];
  onSelectDate?: (date: Date) => void;
}

export function CalendarView({ entries, onSelectDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the beginning of the month
  const startDay = monthStart.getDay();
  const paddedDays = Array(startDay).fill(null).concat(days);

  const getEntryForDate = (date: Date) => {
    return entries.find(entry => isSameDay(new Date(entry.date), date));
  };

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="font-display text-lg font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {paddedDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const entry = getEntryForDate(day);
          const mood = entry ? getMoodByValue(entry.mood) : null;
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate?.(day)}
              className={cn(
                "group relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-300 overflow-hidden",
                "hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-coral hover:ring-offset-2",
                !isCurrentMonth && "opacity-40",
                isCurrentDay && "ring-2 ring-coral ring-offset-2",
                !entry && "hover:bg-coral-light/50"
              )}
            >
              {entry?.thumbnailUrl ? (
                <>
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${entry.thumbnailUrl})` }} />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                </>
              ) : entry ? (
                <div className="absolute inset-0 bg-coral-light" />
              ) : null}

              <div className="relative z-10 flex flex-col items-center">
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  entry?.thumbnailUrl ? "text-white" : isCurrentDay ? "text-coral" : "text-foreground"
                )}>
                  {format(day, 'd')}
                </span>
                {mood && (
                  <span className="text-xs mt-0.5 scale-75 group-hover:scale-100 transition-transform filter drop-shadow-md">
                    {mood.emoji}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
