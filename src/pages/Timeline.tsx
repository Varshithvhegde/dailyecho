import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { CalendarView } from '@/components/diary/CalendarView';
import { EntryCard } from '@/components/diary/EntryCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Grid, List, Loader2 } from 'lucide-react';
import { moods } from '@/data/moods';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useDiaryEntries } from '@/hooks/useDiaryEntries';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'grid' | 'calendar';

export default function Timeline() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { entries, loading: entriesLoading } = useDiaryEntries();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);

  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchQuery ||
      entry.transcript?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMood = !selectedMoodFilter || entry.mood === selectedMoodFilter;
    return matchesSearch && matchesMood;
  });

  // Convert entries to format CalendarView expects
  const calendarEntries = filteredEntries.map(e => ({
    id: e.id,
    date: new Date(e.date),
    mood: e.mood as any,
    duration: e.duration || 0,
    createdAt: new Date(e.created_at),
    thumbnailUrl: e.thumbnail_url,
  }));

  const handleDateSelect = (date: Date) => {
    // Find entry for this date
    const entry = filteredEntries.find(e => {
      const d = new Date(e.date);
      return d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear();
    });

    if (entry) {
      navigate(`/entry/${entry.id}`);
    }
  };

  if (authLoading || entriesLoading) {
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
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">
            Your Timeline
          </h1>
          <p className="text-muted-foreground">
            Browse through your video diary entries
          </p>
        </div>

        <div className="space-y-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search your entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-card border-border"
              />
            </div>

            <div className="flex gap-1 p-1 rounded-xl bg-muted">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn("rounded-lg", viewMode === 'grid' && "bg-background shadow-sm")}
              >
                <Grid className="w-4 h-4 mr-2" />
                Grid
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('calendar')}
                className={cn("rounded-lg", viewMode === 'calendar' && "bg-background shadow-sm")}
              >
                <List className="w-4 h-4 mr-2" />
                Calendar
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedMoodFilter === null ? "coral" : "glass"}
              size="sm"
              onClick={() => setSelectedMoodFilter(null)}
              className="rounded-full"
            >
              All Moods
            </Button>
            {moods.map((mood) => (
              <Button
                key={mood.value}
                variant={selectedMoodFilter === mood.value ? "coral" : "glass"}
                size="sm"
                onClick={() => setSelectedMoodFilter(selectedMoodFilter === mood.value ? null : mood.value)}
                className="rounded-full gap-1"
              >
                <span>{mood.emoji}</span>
                <span className="hidden sm:inline">{mood.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {viewMode === 'calendar' ? (
            <div className="grid lg:grid-cols-2 gap-6">
              <CalendarView entries={calendarEntries} onSelectDate={handleDateSelect} />
              <div className="space-y-4">
                <h3 className="font-display text-lg font-medium text-foreground">
                  Entries ({filteredEntries.length})
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {filteredEntries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} onClick={() => navigate(`/entry/${entry.id}`)} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}

          {filteredEntries.length === 0 && (
            <div className="glass-card p-12 rounded-2xl text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-display text-xl font-medium text-foreground mb-2">
                No entries found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
