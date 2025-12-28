import { useState } from 'react';
import { DiaryEntry } from '@/types/diary';
import { getMuxGifUrl } from '@/lib/mux';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { MuxPlayer } from '@/components/video/MuxPlayer';
import { Loader2, Maximize2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type DiaryEntryRow = Database['public']['Tables']['diary_entries']['Row'];

interface EchoWallProps {
    entries: DiaryEntryRow[];
}

export function EchoWall({ entries }: EchoWallProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 p-4 animate-fade-in">
            {entries.map((entry) => (
                <Dialog key={entry.id}>
                    <DialogTrigger asChild>
                        <div
                            className={cn(
                                "relative break-inside-avoid rounded-2xl overflow-hidden cursor-zoom-in group transition-all duration-500",
                                "hover:shadow-2xl hover:scale-[1.02] hover:z-10",
                                // Random aspect ratios/heights for visual interest (simulated by content, 
                                // but since gifs are usually 16:9, we'll stick to that or crop)
                                "aspect-video bg-muted"
                            )}
                            onMouseEnter={() => setHoveredId(entry.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            {/* Retro CRT Scanline Effect Overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-20 group-hover:opacity-0 transition-opacity" />

                            {/* The GIF */}
                            {entry.mux_playback_id ? (
                                <img
                                    src={getMuxGifUrl(entry.mux_playback_id)}
                                    alt="Memory"
                                    className={cn(
                                        "w-full h-full object-cover transition-all duration-700",
                                        // Black and white by default, color on hover
                                        "grayscale hover:grayscale-0",
                                        "scale-110 group-hover:scale-100" // Subtle zoom out effect on hover
                                    )}
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                    <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                                </div>
                            )}

                            {/* Info Overlay (appears on hover) */}
                            <div className={cn(
                                "absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 text-center backdrop-blur-[2px] z-20",
                            )}>
                                <p className="font-display text-lg font-bold translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    {format(new Date(entry.date), 'MMM d, yyyy')}
                                </p>
                                <div className="w-8 h-1 bg-coral rounded-full my-2 scale-0 group-hover:scale-100 transition-transform duration-500 delay-100" />
                                <p className="text-sm font-light italic opacity-90 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 line-clamp-2">
                                    "{entry.transcript || 'No words...'}"
                                </p>
                                <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-widest opacity-70">
                                    <Maximize2 className="w-3 h-3" />
                                    Expand
                                </div>
                            </div>

                            {/* Mood Color Tag (always visible but subtle) */}
                            <div className={cn(
                                "absolute top-3 left-3 w-3 h-3 rounded-full shadow-lg z-20 transition-all duration-300",
                                entry.mood === 'happy' ? 'bg-yellow-400' :
                                    entry.mood === 'sad' ? 'bg-blue-400' :
                                        entry.mood === 'excited' ? 'bg-orange-400' :
                                            entry.mood === 'calm' ? 'bg-green-400' :
                                                'bg-gray-400',
                                hoveredId === entry.id ? 'scale-125 ring-2 ring-white' : 'opacity-80'
                            )} />
                        </div>
                    </DialogTrigger>

                    <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none text-white">
                        <div className="aspect-video w-full relative">
                            {entry.mux_playback_id && (
                                <MuxPlayer
                                    playbackId={entry.mux_playback_id}
                                    className="w-full h-full"
                                    autoPlay
                                    title={format(new Date(entry.date), 'MMMM do, yyyy')}
                                />
                            )}
                        </div>
                        <div className="p-6 bg-gradient-to-t from-gray-900 to-black">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-display font-medium">
                                    {format(new Date(entry.date), 'EEEE, MMMM do')}
                                </h2>
                                <div className="px-3 py-1 rounded-full bg-white/10 text-sm">
                                    {entry.mood}
                                </div>
                            </div>
                            <p className="text-gray-400 leading-relaxed font-serif text-lg">
                                {entry.transcript}
                            </p>
                        </div>
                    </DialogContent>
                </Dialog>
            ))}
        </div>
    );
}
