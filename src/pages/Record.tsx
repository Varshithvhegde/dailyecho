import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { MoodSelector } from '@/components/diary/MoodSelector';
import { VideoRecorder } from '@/components/diary/VideoRecorder';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Mood } from '@/types/diary';
import { useAuth } from '@/hooks/useAuth';

type RecordStep = 'mood' | 'record' | 'complete';

export default function Record() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<RecordStep>('mood');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
  };

  const handleRecordingComplete = (entryId: string) => {
    console.log('Recording complete, entry ID:', entryId);
    setStep('complete');
    
    // Navigate back to home after a short delay
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 md:py-12 max-w-3xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['mood', 'record'].map((s, i) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s || (step === 'complete' && i <= 1)
                  ? 'w-12 bg-coral'
                  : 'w-8 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="animate-fade-in">
          {step === 'mood' && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="font-display text-3xl font-semibold text-foreground">
                  New Entry
                </h1>
                <p className="text-muted-foreground">
                  Let's start by checking in with how you're feeling
                </p>
              </div>
              
              <div className="glass-card p-6 md:p-8 rounded-3xl">
                <MoodSelector
                  selectedMood={selectedMood}
                  onSelectMood={handleMoodSelect}
                />
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  variant="coral"
                  onClick={() => setStep('record')}
                  disabled={!selectedMood}
                  className="gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 'record' && selectedMood && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="font-display text-3xl font-semibold text-foreground">
                  Record Your Thoughts
                </h1>
                <p className="text-muted-foreground">
                  Take a moment to share what's on your mind
                </p>
              </div>
              
              <VideoRecorder 
                mood={selectedMood}
                onRecordingComplete={handleRecordingComplete} 
              />
              
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setStep('mood')}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Mood
                </Button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center space-y-6 py-12">
              <div className="w-20 h-20 mx-auto rounded-full bg-sage flex items-center justify-center animate-scale-in">
                <span className="text-4xl">✨</span>
              </div>
              <h1 className="font-display text-3xl font-semibold text-foreground">
                Entry Saved!
              </h1>
              <p className="text-muted-foreground">
                Great job reflecting today. Redirecting you home...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
