import MuxPlayerComponent from '@mux/mux-player-react';
import { cn } from '@/lib/utils';

interface MuxPlayerProps {
  playbackId: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  poster?: string;
  title?: string;
  accentColor?: string;
  onEnded?: () => void;
}

export function MuxPlayer({
  playbackId,
  className,
  autoPlay = false,
  muted = false,
  loop = false,
  poster,
  title,
  accentColor = '#7c3aed',
  onEnded,
}: MuxPlayerProps) {
  return (
    <MuxPlayerComponent
      playbackId={playbackId}
      streamType="on-demand"
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      poster={poster}
      title={title}
      accentColor={accentColor}
      primaryColor="#ffffff"
      secondaryColor="#000000"
      className={cn('w-full aspect-video rounded-2xl overflow-hidden', className)}
      metadata={{
        video_title: title || 'Diary Entry',
        player_name: 'Video Diary Player',
      }}
      onEnded={onEnded}
    />
  );
}
