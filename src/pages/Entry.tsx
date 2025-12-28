import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock, Trash2, FileText, RefreshCw, Sparkles, Bot, Quote } from 'lucide-react';
import { format } from 'date-fns';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MuxPlayer } from '@/components/video/MuxPlayer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getMuxThumbnailUrl } from '@/lib/mux';
import { moods } from '@/data/moods';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AIAnalysis {
  title: string;
  summary: string;
  emotional_analysis: string;
  key_topics: string[];
  advice: string;
  sentiment_score: number;
}

interface DiaryEntry {
  id: string;
  date: string;
  mood: string;
  mux_playback_id: string | null;
  mux_asset_id: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  transcript: string | null;
  video_status: string | null;
  mux_track_id: string | null;
  ai_analysis: AIAnalysis | null;
}

const Entry = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Realtime subscription
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'diary_entries',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          if (payload.new) {
            setEntry(payload.new as DiaryEntry);
            toast.info('Entry updated');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchEntry = async () => {
    if (!id || !user) return;

    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching entry:', error);
      toast.error('Failed to load entry');
    }

    setEntry(data as unknown as DiaryEntry);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchEntry();
    }
  }, [id, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEntry();
    setRefreshing(false);
    toast.success('Entry refreshed');
  };

  const handleDelete = async () => {
    if (!entry) return;

    setDeleting(true);
    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', entry.id);

    if (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
      setDeleting(false);
      return;
    }

    toast.success('Entry deleted');
    navigate('/');
  };

  const handleAnalyze = async () => {
    if (!entry || !entry.transcript) return;

    setAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ entryId: entry.id }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setEntry(prev => prev ? { ...prev, ai_analysis: result } : null);
      toast.success('Analysis complete!');

    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze entry. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const moodData = moods.find(m => m.value === entry?.mood);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="aspect-video bg-muted rounded-xl" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-2xl mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Entry not found</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your diary entry and video.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="space-y-6">
          {/* Header info */}
          <div className="flex items-center gap-4">
            {moodData && (
              <div className="text-4xl">{moodData.emoji}</div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold capitalize">{entry.mood}</h1>
                <Badge variant={entry.video_status === 'ready' ? 'default' : 'secondary'}>
                  {entry.video_status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(entry.date), 'MMMM d, yyyy')}
                </span>
                {entry.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {entry.duration}s
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Video player */}
          {entry.mux_playback_id && entry.video_status === 'ready' ? (
            <div className="rounded-xl overflow-hidden shadow-lg">
              <MuxPlayer
                playbackId={entry.mux_playback_id}
                poster={entry.thumbnail_url || getMuxThumbnailUrl(entry.mux_playback_id)}
                title={`${moodData?.label || entry.mood} - ${format(new Date(entry.date), 'MMM d, yyyy')}`}
              />
            </div>
          ) : entry.video_status === 'processing' ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Video is still processing...</p>
                <p className="text-xs text-muted-foreground mt-2">This usually takes a few seconds</p>
              </CardContent>
            </Card>
          ) : entry.video_status === 'error' ? (
            <Card className="border-destructive">
              <CardContent className="py-12 text-center">
                <p className="text-destructive font-medium">Video processing failed</p>
                <p className="text-sm text-muted-foreground mt-2">Please try recording again</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-pulse">
                  <div className="h-8 w-8 bg-muted rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Waiting for video...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transcript */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entry.transcript ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {entry.transcript}
                  </p>
                </div>
              ) : entry.video_status === 'ready' ? (
                <div className="text-center py-4">
                  <div className="animate-pulse flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-100" />
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-200" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Generating transcript...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This may take a minute. Click refresh to check.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Transcript will be available once the video is processed
                </p>
              )}
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <div className="space-y-4">
            {entry.ai_analysis ? (
              <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Sparkles className="w-24 h-24 text-indigo-500" />
                </div>

                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                    <Sparkles className="h-5 w-5" />
                    AI Reflection
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6 relative z-10">
                  <div>
                    <h3 className="text-xl font-bold font-display mb-2">{entry.ai_analysis.title}</h3>
                    <p className="text-muted-foreground italic">{entry.ai_analysis.summary}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {entry.ai_analysis.key_topics.map((topic, i) => (
                      <Badge key={i} variant="secondary" className="bg-white/50 dark:bg-black/50 hover:bg-white/80">
                        {topic}
                      </Badge>
                    ))}
                    <Badge variant="outline" className={cn(
                      "ml-auto font-mono",
                      entry.ai_analysis.sentiment_score > 70 ? "text-green-600 border-green-200 bg-green-50" :
                        entry.ai_analysis.sentiment_score < 40 ? "text-red-600 border-red-200 bg-red-50" :
                          "text-yellow-600 border-yellow-200 bg-yellow-50"
                    )}>
                      Sentiment: {entry.ai_analysis.sentiment_score}/100
                    </Badge>
                  </div>

                  <div className="bg-white/60 dark:bg-black/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      Emotional Insight
                    </h4>
                    <p className="text-sm leading-relaxed">{entry.ai_analysis.emotional_analysis}</p>
                  </div>

                  <div className="bg-indigo-100/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50">
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2">
                      <Quote className="w-4 h-4" />
                      Daily Wisdom
                    </h4>
                    <p className="text-indigo-900 dark:text-indigo-100 font-medium font-serif italic text-lg">
                      "{entry.ai_analysis.advice}"
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Unlock AI Insights</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                      Generate a deep emotional analysis, summary, and personalized advice based on your diary entry.
                    </p>
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzing || !entry.transcript}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Reflection
                      </>
                    )}
                  </Button>
                  {!entry.transcript && (
                    <p className="text-xs text-muted-foreground">
                      Wait for transcript to be generated first
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </main >
    </div >
  );
};

export default Entry;
