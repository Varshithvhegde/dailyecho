import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

export function useDiaryEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching entries:', error);
        return;
      }

      setEntries(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const getStreak = () => {
    if (entries.length === 0) return 0;

    let streak = 0;
    const today = new Date();

    // Check up to 30 days back
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date();
      checkDate.setDate(today.getDate() - i);
      const dateStr = format(checkDate, 'yyyy-MM-dd');

      const hasEntry = entries.some(entry => entry.date === dateStr);

      if (hasEntry) {
        streak++;
      } else if (i > 0) {
        // If we break the streak (missing yesterday or before), stop counting.
        // We allow missing TODAY (i=0) because the user might just be starting.
        // But if i=0 and hasEntry is true, streak becomes 1, loop continues.
        // If i=0 and hasEntry is false, we continue to i=1.
        // If i=1 hasEntry is false (missing yesterday), then we break.
        break;
      }
    }

    return streak;
  };

  const getMoodStats = () => {
    const stats: Record<string, number> = {
      happy: 0,
      sad: 0,
      anxious: 0,
      excited: 0,
      calm: 0,
      stressed: 0,
      grateful: 0,
      reflective: 0,
    };

    entries.forEach(entry => {
      if (entry.mood && stats[entry.mood] !== undefined) {
        stats[entry.mood]++;
      }
    });

    return stats;
  };

  const hasEntryToday = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return entries.some(entry => entry.date === today);
  };

  return {
    entries,
    loading,
    refetch: fetchEntries,
    getStreak,
    getMoodStats,
    hasEntryToday,
  };
}
