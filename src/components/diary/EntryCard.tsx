import { format } from 'date-fns';
import { Play, Clock, Loader2 } from 'lucide-react';
import { getMoodByValue } from '@/data/moods';
import { cn } from '@/lib/utils';
import { getMuxGifUrl } from '@/lib/mux';
import type { Database } from '@/integrations/supabase/types';

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

interface EntryCardProps {
  entry: DiaryEntry;
  onClick?: () => void;
}

export function EntryCard({ entry, onClick }: EntryCardProps) {
  const mood = getMoodByValue(entry.mood);
  const isProcessing = entry.video_status !== 'ready';

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <button
      onClick={onClick}
      disabled={isProcessing}
      className={cn(
        "group w-full text-left rounded-2xl overflow-hidden bg-card border border-border/50",
        "transition-all duration-300 hover:shadow-card hover:scale-[1.02] hover:border-coral/30",
        "focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2",
        isProcessing && "opacity-70 cursor-wait"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-coral-light to-lavender-light">
        {entry.thumbnail_url ? (
          <>
            <img
              src={entry.thumbnail_url}
              alt=""
              className="w-full h-full object-cover group-hover:opacity-0 transition-opacity absolute inset-0 z-10"
              loading="lazy"
            />
            {/* Animated GIF on hover */}
            {entry.mux_playback_id && (
              <img
                src={getMuxGifUrl(entry.mux_playback_id)}
                alt="Preview"
                className="w-full h-full object-cover absolute inset-0 z-0"
                loading="lazy"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isProcessing ? (
              <Loader2 className="w-12 h-12 text-coral/50 animate-spin" />
            ) : (
              <Play className="w-12 h-12 text-coral/50" />
            )}
          </div>
        )}

        {/* Play overlay - Only show if not processing */}
        {!isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 pointer-events-none z-20">
            <div className="w-14 h-14 rounded-full bg-primary-foreground/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <Play className="w-6 h-6 text-coral ml-1" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Processing badge */}
        {isProcessing && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-foreground/70 text-primary-foreground text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </div>
        )}

        {/* Duration badge */}
        {!isProcessing && entry.duration && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-foreground/70 text-primary-foreground text-xs">
            <Clock className="w-3 h-3" />
            {formatDuration(entry.duration)}
          </div>
        )}

        {/* Mood badge */}
        {mood && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-primary-foreground/90 text-sm">
            {mood.emoji}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-medium text-foreground">
            {format(new Date(entry.date), 'EEEE')}
          </span>
          <span className="text-sm text-muted-foreground">
            {format(new Date(entry.date), 'MMM d, yyyy')}
          </span>
        </div>

        {entry.transcript && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {entry.transcript}
          </p>
        )}
      </div>
    </button>
  );
}
