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
        "group w-full text-left rounded-3xl overflow-hidden bg-card/60 backdrop-blur-md border border-white/20 dark:border-white/5",
        "transition-all duration-500 hover:shadow-glow hover:-translate-y-1 hover:border-coral/50",
        "focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2",
        isProcessing && "opacity-70 cursor-wait"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-coral/10 to-lavender/10 overflow-hidden">
        {entry.thumbnail_url ? (
          <>
            <img
              src={entry.thumbnail_url}
              alt=""
              className="w-full h-full object-cover transition-opacity duration-700 absolute inset-0 z-10 group-hover:opacity-0"
              loading="lazy"
            />
            {/* Animated GIF on hover */}
            {entry.mux_playback_id && (
              <img
                src={getMuxGifUrl(entry.mux_playback_id)}
                alt="Preview"
                className="w-full h-full object-cover absolute inset-0 z-0 scale-110 group-hover:scale-100 transition-transform duration-700"
                loading="lazy"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isProcessing ? (
              <Loader2 className="w-12 h-12 text-coral/50 animate-spin" />
            ) : (
              <Play className="w-12 h-12 text-coral/30" />
            )}
          </div>
        )}

        {/* Play overlay - Only show if not processing */}
        {!isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none z-20 group-hover:bg-black/10 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg scale-50 group-hover:scale-100">
              <Play className="w-5 h-5 text-coral ml-1" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Processing badge */}
        {isProcessing && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </div>
        )}

        {/* Duration badge */}
        {!isProcessing && entry.duration && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10">
            <Clock className="w-3 h-3" />
            {formatDuration(entry.duration)}
          </div>
        )}

        {/* Mood badge */}
        {mood && (
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md text-sm shadow-sm border border-white/20">
            {mood.emoji}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-display text-xl font-semibold text-foreground tracking-tight">
            {format(new Date(entry.date), 'EEEE')}
          </span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {format(new Date(entry.date), 'MMM d')}
          </span>
        </div>

        {entry.transcript && (
          <p className="text-sm text-foreground/70 line-clamp-2 leading-relaxed font-serif">
            "{entry.transcript}"
          </p>
        )}
      </div>
    </button>
  );
}
