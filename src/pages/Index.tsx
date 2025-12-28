import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { StreakCounter } from '@/components/diary/StreakCounter';
import { EntryCard } from '@/components/diary/EntryCard';
import { MoodChart } from '@/components/diary/MoodChart';
import { Video, ArrowRight, Calendar, Sparkles, LogIn, Loader2, History, PlayCircle } from 'lucide-react';
import { getRandomPrompt } from '@/data/moods';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useDiaryEntries } from '@/hooks/useDiaryEntries';
import { Mood } from '@/types/diary';
import { StoryViewer } from '@/components/diary/StoryViewer';
import type { Database } from '@/integrations/supabase/types';

type DiaryEntryRow = Database['public']['Tables']['diary_entries']['Row'];

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { entries, loading: entriesLoading, getStreak, getMoodStats, hasEntryToday } = useDiaryEntries();
  const [todayPrompt] = useState(getRandomPrompt);

  const [storyOpen, setStoryOpen] = useState(false);
  const [storyEntries, setStoryEntries] = useState<DiaryEntryRow[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [storyTitle, setStoryTitle] = useState('');

  const openStory = (mode: 'recent' | 'flashback' | 'joy') => {
    let selectedEntries: DiaryEntryRow[] = [];

    if (mode === 'recent') {
      selectedEntries = entries.slice(0, 5); // First 5 (since they are ordered desc)
      setStoryTitle('Recent Moments');
    } else if (mode === 'flashback') {
      // Random 5 from past
      selectedEntries = [...entries].sort(() => 0.5 - Math.random()).slice(0, 5);
      setStoryTitle('Flashback');
    } else if (mode === 'joy') {
      // Happy/Excited/Grateful
      selectedEntries = entries.filter(e =>
        ['happy', 'excited', 'grateful'].includes(e.mood)
      ).slice(0, 5);
      setStoryTitle('Moments of Joy');
    }

    if (selectedEntries.length > 0) {
      setStoryEntries(selectedEntries);
      setStoryOpen(true);
    }
  };

  const streak = getStreak();
  const moodStats = getMoodStats() as Record<Mood, number>;
  const recentEntries = entries.slice(0, 3);
  const todayHasEntry = hasEntryToday();

  const totalMinutes = Math.round(
    entries.reduce((acc, e) => acc + (e.duration || 0), 0) / 60
  );

  // Time Capsule logic
  const timeCapsuleEntry = entries.find(e => {
    const d = new Date(e.date);
    const today = new Date();
    const isOneYearAgo = d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear() - 1;
    const isOneMonthAgo = d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() - 1 &&
      d.getFullYear() === today.getFullYear();
    return isOneYearAgo || isOneMonthAgo;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8 md:py-12 max-w-5xl">
        {/* Hero Section */}
        {/* Hero Section */}
        <section className="relative mb-12 animate-fade-in group">
          {/* Decorative ambient light specifically for Hero */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-coral/20 rounded-full blur-[100px] -z-10 group-hover:bg-coral/30 transition-colors duration-1000" />

          <div className="glass-card p-8 md:p-12 rounded-[2.5rem] shadow-card relative overflow-hidden transition-all duration-500 hover:shadow-glow border-white/40 dark:border-white/10">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
              <div className="space-y-6 max-w-xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-coral/10 text-coral border border-coral/20 backdrop-blur-sm shadow-sm">
                  <Sparkles className="w-4 h-4 animate-pulse-soft" />
                  <span className="text-sm font-medium tracking-wide">Daily Inspiration</span>
                </div>

                <div className="space-y-2">
                  <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-[1.1] tracking-tight text-balance">
                    "{todayPrompt}"
                  </h1>
                  <p className="text-xl text-muted-foreground font-light">
                    {format(new Date(), 'EEEE, MMMM d')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-5 w-full md:w-auto min-w-[200px] animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {user ? (
                  <>
                    <Link to="/record" className="w-full">
                      <Button variant="coral" size="xl" className="w-full gap-3 shadow-lg shadow-coral/30 hover:shadow-coral/50 transition-all duration-300 transform hover:scale-[1.02] h-16 rounded-2xl text-lg">
                        <div className="relative flex items-center justify-center">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-20 animate-ping" />
                          <Video className="w-6 h-6 relative z-10" />
                        </div>
                        {todayHasEntry ? 'Add Another Entry' : 'Record Today'}
                      </Button>
                    </Link>
                    <div className="flex justify-center p-2 bg-white/50 dark:bg-black/20 rounded-2xl backdrop-blur-sm">
                      <StreakCounter streak={streak} />
                    </div>
                  </>
                ) : (
                  <Link to="/auth" className="w-full">
                    <Button variant="coral" size="xl" className="w-full gap-3 shadow-lg shadow-coral/25 hover:shadow-coral/40 h-14 rounded-2xl">
                      <LogIn className="w-5 h-5" />
                      Sign In to Start
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {user && entries.length > 0 && (
          /* Memory Stories Bar */
          <section className="mb-8 overflow-x-auto pb-4 hide-scrollbar">
            <div className="flex gap-4">
              {/* Recent Story */}
              <button onClick={() => openStory('recent')} className="flex flex-col items-center gap-2 group min-w-[80px]">
                <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-coral to-purple-500 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full bg-background border-2 border-background overflow-hidden relative">
                    {entries[0]?.thumbnail_url ? (
                      <img src={entries[0].thumbnail_url} alt="Recent" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center"><Video className="w-5 h-5 text-muted-foreground" /></div>
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <PlayCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium">Recent</span>
              </button>

              {/* Joy Story */}
              <button onClick={() => openStory('joy')} className="flex flex-col items-center gap-2 group min-w-[80px]">
                <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 to-orange-500 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full bg-background border-2 border-background overflow-hidden relative flex items-center justify-center bg-yellow-50">
                    <span className="text-2xl">😊</span>
                  </div>
                </div>
                <span className="text-xs font-medium">Joy</span>
              </button>

              {/* Flashback Story */}
              <button onClick={() => openStory('flashback')} className="flex flex-col items-center gap-2 group min-w-[80px]">
                <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-blue-400 to-indigo-500 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full bg-background border-2 border-background overflow-hidden relative flex items-center justify-center bg-blue-50">
                    <History className="w-6 h-6 text-indigo-500" />
                  </div>
                </div>
                <span className="text-xs font-medium">Flashback</span>
              </button>
            </div>
          </section>
        )}

        <StoryViewer
          open={storyOpen}
          onClose={() => setStoryOpen(false)}
          entries={storyEntries}
        />

        {user ? (
          <>
            {/* Stats & Recent Grid */}
            <section className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Mood Overview */}
              <div className="glass-card p-6 rounded-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-medium text-foreground">
                    Mood Overview
                  </h2>
                  <Link to="/insights">
                    <Button variant="ghost" size="sm" className="gap-1 text-coral">
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                <MoodChart moodStats={moodStats} />
              </div>

              {/* Quick Stats */}
              <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-lavender">
                      <Calendar className="w-6 h-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-3xl font-display font-bold text-foreground">
                        {entries.length}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Entries</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-sage">
                      <Video className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-3xl font-display font-bold text-foreground">
                        {totalMinutes}
                      </p>
                      <p className="text-sm text-muted-foreground">Minutes Recorded</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Time Capsule */}
            {timeCapsuleEntry && (
              <section className="mb-12 animate-fade-in" style={{ animationDelay: '0.25s' }}>
                <div className="glass-card p-6 rounded-2xl border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-white/50 dark:from-indigo-950/20 dark:to-background">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg">
                      <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-medium text-foreground">
                        Time Capsule
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        On this day in the past...
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <EntryCard
                      entry={timeCapsuleEntry}
                      onClick={() => navigate(`/entry/${timeCapsuleEntry.id}`)}
                    />
                    <div className="space-y-4">
                      <p className="text-lg font-serif italic text-foreground/80">
                        "Your thoughts exactly {new Date(timeCapsuleEntry.date).getFullYear() < new Date().getFullYear() ? "one year" : "one month"} ago."
                      </p>
                      <Button variant="outline" className="w-full md:w-auto" onClick={() => navigate(`/entry/${timeCapsuleEntry.id}`)}>
                        Relive Memory
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Recent Entries */}
            <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-medium text-foreground">
                  Recent Entries
                </h2>
                <Link to="/timeline">
                  <Button variant="ghost" className="gap-1 text-coral">
                    View Timeline
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {entriesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-coral" />
                </div>
              ) : recentEntries.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentEntries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onClick={() => navigate(`/entry/${entry.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-card p-12 rounded-2xl text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-display text-xl font-medium text-foreground mb-2">
                    No entries yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Start your video diary journey today
                  </p>
                  <Link to="/record">
                    <Button variant="coral" size="lg" className="gap-2">
                      <Video className="w-5 h-5" />
                      Record Your First Entry
                    </Button>
                  </Link>
                </div>
              )}
            </section>
          </>
        ) : (
          /* Not logged in state */
          <section className="animate-fade-in text-center py-12">
            <div className="glass-card p-12 rounded-2xl max-w-xl mx-auto">
              <Video className="w-20 h-20 mx-auto mb-6 text-coral" />
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                Your Personal Video Diary
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Record daily 1-minute reflections, track your moods, and discover patterns in your emotional journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button variant="coral" size="lg" className="gap-2 w-full sm:w-auto">
                    <LogIn className="w-5 h-5" />
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;
