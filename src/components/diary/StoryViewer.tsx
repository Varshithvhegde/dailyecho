import { useState, useEffect, useCallback } from 'react';
import { getMuxThumbnailUrl } from '@/lib/mux';
import { MuxPlayer } from '@/components/video/MuxPlayer';
import { X, ChevronLeft, ChevronRight, MessageSquareQuote } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { getMoodByValue } from '@/data/moods';
import { cn } from '@/lib/utils';
import { AIAnalysis } from '@/types/diary';
import type { Database } from '@/integrations/supabase/types';

type DiaryEntryRow = Database['public']['Tables']['diary_entries']['Row'];

interface StoryViewerProps {
    entries: DiaryEntryRow[];
    initialIndex?: number;
    open: boolean;
    onClose: () => void;
}

export function StoryViewer({ entries, initialIndex = 0, open, onClose }: StoryViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (open) {
            setCurrentIndex(initialIndex);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [open, initialIndex]);

    const handleNext = useCallback(() => {
        if (currentIndex < entries.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    }, [currentIndex, entries.length, onClose]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!open) return;
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === ' ') setIsPaused(prev => !prev);
    }, [open, onClose, handleNext, handlePrev]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!open) return null;

    const currentEntry = entries[currentIndex];
    const mood = getMoodByValue(currentEntry.mood);
    const aiAnalysis = currentEntry.ai_analysis as unknown as AIAnalysis | null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-200 backdrop-blur-sm">
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-2 z-20">
                {entries.map((entry, idx) => (
                    <div
                        key={entry.id}
                        className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
                    >
                        <div
                            className={cn(
                                "h-full bg-white transition-all duration-300",
                                idx < currentIndex ? "w-full" :
                                    idx === currentIndex ? "w-full animate-progress origin-left" : "w-0"
                            )}
                        />
                    </div>
                ))}
            </div>

            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-8 right-8 z-30 text-white/80 hover:text-white transition-colors"
            >
                <X className="w-8 h-8" />
            </button>

            {/* Main Content Area */}
            <div className="relative w-full max-w-[500px] h-[85vh] flex flex-col items-center justify-center">

                {/* Date & Mood Header */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-xl border border-white/10">
                        {mood?.emoji}
                    </div>
                    <div className="text-white drop-shadow-md">
                        <h3 className="font-semibold text-lg leading-tight">
                            {format(new Date(currentEntry.date), 'EEEE, MMM d')}
                        </h3>
                        <p className="text-xs opacity-80 font-medium tracking-wide">
                            {format(new Date(currentEntry.date), 'h:mm a')} • {mood?.label}
                        </p>
                    </div>
                </div>

                {/* Video Player */}
                <div className="w-full h-full rounded-2xl overflow-hidden bg-black relative shadow-2xl border border-white/10">
                    {currentEntry.mux_playback_id ? (
                        <MuxPlayer
                            playbackId={currentEntry.mux_playback_id}
                            className="w-full h-full object-cover"
                            autoPlay={!isPaused}
                            onEnded={handleNext}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/50">
                            Video not available
                        </div>
                    )}

                    {/* Transcript / Quote Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-24">
                        {aiAnalysis?.advice ? (
                            <div className="mb-4">
                                <div className="flex gap-2 text-indigo-300 mb-2 items-center">
                                    <MessageSquareQuote className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Daily Wisdom</span>
                                </div>
                                <p className="text-white font-serif text-xl italic leading-relaxed">
                                    "{aiAnalysis.advice}"
                                </p>
                            </div>
                        ) : currentEntry.transcript ? (
                            <p className="text-white/90 text-sm line-clamp-3 leading-relaxed">
                                {currentEntry.transcript}
                            </p>
                        ) : null}
                    </div>
                </div>

                {/* Navigation Areas (invisible) */}
                <div
                    className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer"
                    onClick={handlePrev}
                />
                <div
                    className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-pointer"
                    onClick={handleNext}
                />
            </div>

            {/* Side Nav Buttons (Desktop) */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute left-8 text-white/50 hover:text-white hidden md:flex"
                onClick={handlePrev}
                disabled={currentIndex === 0}
            >
                <ChevronLeft className="w-12 h-12" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="absolute right-8 text-white/50 hover:text-white hidden md:flex"
                onClick={handleNext}
                disabled={currentIndex === entries.length - 1}
            >
                <ChevronRight className="w-12 h-12" />
            </Button>

        </div>
    );
}
