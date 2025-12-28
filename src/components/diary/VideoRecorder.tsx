import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Square, RotateCcw, Check, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createMuxUpload, uploadVideoToMux, checkMuxStatus } from '@/lib/mux';
import { Mood } from '@/types/diary';
import { toast } from 'sonner';

interface VideoRecorderProps {
  mood: Mood;
  onRecordingComplete: (entryId: string) => void;
  maxDuration?: number;
}

type RecordingState = 'idle' | 'countdown' | 'recording' | 'preview' | 'uploading' | 'processing';

export function VideoRecorder({ mood, onRecordingComplete, maxDuration = 60 }: VideoRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: true,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setError(null);
    } catch (err) {
      setError('Unable to access camera. Please grant permission.');
      console.error('Camera error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    setState('countdown');
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9',
    });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      
      if (previewRef.current) {
        previewRef.current.src = URL.createObjectURL(blob);
      }
      
      setState('preview');
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setState('recording');
    setRecordingTime(0);
    
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= maxDuration - 1) {
          stopRecording();
          return maxDuration;
        }
        return prev + 1;
      });
    }, 1000);
  }, [maxDuration]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const retakeRecording = useCallback(() => {
    setRecordedBlob(null);
    setState('idle');
    startCamera();
  }, [startCamera]);

  const confirmRecording = useCallback(async () => {
    if (!recordedBlob) return;
    
    setState('uploading');
    stopCamera();
    
    try {
      // Create Mux upload
      setUploadProgress(10);
      const { uploadUrl, entryId } = await createMuxUpload(mood);
      
      // Upload video to Mux
      setUploadProgress(30);
      await uploadVideoToMux(uploadUrl, recordedBlob);
      
      setUploadProgress(60);
      setState('processing');
      
      // Poll for video ready status
      let attempts = 0;
      const maxAttempts = 30;
      
      const checkStatus = async () => {
        attempts++;
        setUploadProgress(60 + Math.min(attempts * 1.3, 35));
        
        try {
          const status = await checkMuxStatus(entryId);
          
          if (status.status === 'ready') {
            setUploadProgress(100);
            toast.success('Entry saved successfully!');
            onRecordingComplete(entryId);
            return;
          }
          
          if (status.status === 'error') {
            throw new Error('Video processing failed');
          }
          
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 2000);
          } else {
            // Even if not fully processed, the entry is saved
            toast.success('Entry saved! Video is still processing.');
            onRecordingComplete(entryId);
          }
        } catch (err) {
          console.error('Status check error:', err);
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 2000);
          }
        }
      };
      
      setTimeout(checkStatus, 3000);
      
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload video. Please try again.');
      setState('preview');
    }
  }, [recordedBlob, mood, onRecordingComplete, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startCamera, stopCamera]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="relative aspect-video rounded-3xl overflow-hidden bg-foreground/5 shadow-card">
        {/* Live Preview */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={cn(
            "w-full h-full object-cover",
            (state === 'preview' || state === 'uploading' || state === 'processing') && "hidden"
          )}
        />
        
        {/* Recording Preview */}
        <video
          ref={previewRef}
          controls
          playsInline
          className={cn(
            "w-full h-full object-cover",
            state !== 'preview' && "hidden"
          )}
        />
        
        {/* Countdown Overlay */}
        {state === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/60 backdrop-blur-sm">
            <span className="text-8xl font-display font-bold text-primary-foreground animate-scale-in">
              {countdown}
            </span>
          </div>
        )}
        
        {/* Recording Indicator */}
        {state === 'recording' && (
          <>
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span className="text-sm font-medium">REC</span>
            </div>
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-foreground/60 text-primary-foreground">
              <span className="text-sm font-mono font-medium">
                {formatTime(recordingTime)} / {formatTime(maxDuration)}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/20">
              <div 
                className="h-full bg-coral transition-all duration-1000"
                style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
              />
            </div>
          </>
        )}
        
        {/* Uploading/Processing Overlay */}
        {(state === 'uploading' || state === 'processing') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/80 backdrop-blur-sm text-primary-foreground">
            <Upload className="w-12 h-12 mb-4 animate-pulse" />
            <p className="text-lg font-medium mb-2">
              {state === 'uploading' ? 'Uploading...' : 'Processing...'}
            </p>
            <div className="w-48 h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-coral transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm mt-2 text-primary-foreground/70">
              {Math.round(uploadProgress)}%
            </p>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90">
            <div className="text-center p-6">
              <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={startCamera} variant="coral" className="mt-4">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {state === 'idle' && (
          <Button
            onClick={startCountdown}
            variant="record"
            size="icon-lg"
            className="shadow-lg"
          >
            <Video className="h-6 w-6" />
          </Button>
        )}
        
        {state === 'recording' && (
          <Button
            onClick={stopRecording}
            variant="destructive"
            size="icon-lg"
            className="shadow-lg"
          >
            <Square className="h-6 w-6 fill-current" />
          </Button>
        )}
        
        {state === 'preview' && (
          <>
            <Button
              onClick={retakeRecording}
              variant="glass"
              size="lg"
              className="gap-2"
            >
              <RotateCcw className="h-5 w-5" />
              Retake
            </Button>
            <Button
              onClick={confirmRecording}
              variant="coral"
              size="lg"
              className="gap-2"
            >
              <Check className="h-5 w-5" />
              Save Entry
            </Button>
          </>
        )}
        
        {(state === 'uploading' || state === 'processing') && (
          <Button variant="coral" size="lg" disabled>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            {state === 'uploading' ? 'Uploading...' : 'Processing...'}
          </Button>
        )}
      </div>
      
      {state === 'idle' && (
        <p className="text-center text-muted-foreground text-sm">
          Tap to start recording (max {maxDuration} seconds)
        </p>
      )}
    </div>
  );
}
