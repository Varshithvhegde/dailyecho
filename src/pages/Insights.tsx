import { Header } from '@/components/layout/Header';
import { MoodChart } from '@/components/diary/MoodChart';
import { StreakCounter } from '@/components/diary/StreakCounter';
import { CalendarView } from '@/components/diary/CalendarView';
import { moods, getMoodByValue } from '@/data/moods';
import { Video, Clock, TrendingUp, Award, Loader2 } from 'lucide-react';
import { useDiaryEntries } from '@/hooks/useDiaryEntries';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Mood, AIAnalysis } from '@/types/diary';

export default function Insights() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { entries, loading: entriesLoading, getStreak, getMoodStats } = useDiaryEntries();

  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  if (authLoading || entriesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  const streak = getStreak();
  const moodStats = getMoodStats() as Record<Mood, number>;

  const totalMinutes = Math.round(
    entries.reduce((acc, e) => acc + (e.duration || 0), 0) / 60
  );

  const mostFrequentMood = Object.entries(moodStats)
    .sort((a, b) => b[1] - a[1])[0];

  const topMood = mostFrequentMood ? getMoodByValue(mostFrequentMood[0]) : null;

  const stats = [
    {
      icon: Video,
      label: 'Total Entries',
      value: entries.length,
      color: 'bg-coral-light text-coral',
    },
    {
      icon: Clock,
      label: 'Minutes Recorded',
      value: totalMinutes,
      color: 'bg-lavender-light text-secondary-foreground',
    },
    {
      icon: TrendingUp,
      label: 'This Week',
      value: entries.filter(e => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(e.date) >= weekAgo;
      }).length,
      color: 'bg-sage-light text-accent-foreground',
    },
    {
      icon: Award,
      label: 'Top Mood',
      value: topMood ? topMood.emoji : '—',
      subLabel: topMood?.label,
      color: 'bg-peach text-foreground',
    },
  ];

  // Calculate average sentiment score from AI analysis
  const sentimentScores = entries
    .filter(e => e.ai_analysis && typeof e.ai_analysis === 'object' && 'sentiment_score' in e.ai_analysis)
    .map(e => (e.ai_analysis as unknown as AIAnalysis).sentiment_score);

  const avgSentiment = sentimentScores.length > 0
    ? Math.round(sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-8 md:py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">
            Your Insights
          </h1>
          <p className="text-muted-foreground">
            Track your emotional journey over time
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass-card p-5 rounded-2xl"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-3xl font-display font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stat.subLabel || stat.label}
                </p>
              </div>
            );
          })}

          {/* AI Sentiment Stat */}
          {avgSentiment !== null && (
            <div className="glass-card p-5 rounded-2xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-3xl font-display font-bold text-foreground">
                {avgSentiment}
              </p>
              <p className="text-sm text-muted-foreground">
                Avg. Sentiment Score
              </p>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Mood Distribution */}
          <div className="glass-card p-6 rounded-2xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="font-display text-xl font-medium text-foreground mb-4">
              Mood Distribution
            </h2>
            <MoodChart moodStats={moodStats} />
          </div>

          {/* Streak & Calendar */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <StreakCounter streak={streak} className="w-full justify-center" />
            <CalendarView
              entries={entries.map(e => ({
                id: e.id,
                mood: e.mood as Mood,
                duration: e.duration || 0,
                date: new Date(e.date),
                createdAt: new Date(e.created_at),
                thumbnailUrl: e.thumbnail_url || undefined,
                transcript: e.transcript || undefined,
                ai_analysis: e.ai_analysis as unknown as AIAnalysis | null
              }))}
            />
          </div>
        </div>

        {/* Mood Breakdown */}
        <div className="mt-8 glass-card p-6 rounded-2xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h2 className="font-display text-xl font-medium text-foreground mb-6">
            Mood Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {moods.map((mood) => {
              const count = moodStats[mood.value] || 0;
              const percentage = entries.length > 0
                ? Math.round((count / entries.length) * 100)
                : 0;

              return (
                <div
                  key={mood.value}
                  className="p-4 rounded-xl bg-muted/50 text-center"
                >
                  <span className="text-3xl mb-2 block">{mood.emoji}</span>
                  <p className="font-medium text-foreground">{mood.label}</p>
                  <p className="text-2xl font-display font-bold text-foreground mt-1">
                    {count}
                  </p>
                  <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-coral rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {percentage}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
