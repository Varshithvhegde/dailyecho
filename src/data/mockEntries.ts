import { DiaryEntry, Mood } from '@/types/diary';

const moodsList: Mood[] = ['happy', 'calm', 'grateful', 'reflective', 'excited', 'anxious'];

const transcripts = [
  "Today was such a beautiful day. I woke up feeling refreshed and went for a morning walk in the park. The sun was shining and I felt so grateful for this simple moment of peace.",
  "Had a productive meeting at work today. Finally made progress on that project I've been stuck on. Feeling accomplished and ready for what's next.",
  "Spent quality time with family this evening. We cooked dinner together and shared stories. These are the moments I want to remember forever.",
  "Feeling a bit overwhelmed with everything going on, but I'm learning to take things one step at a time. Tomorrow is a new day.",
  "Went to my favorite coffee shop and just enjoyed some quiet time to myself. Sometimes solitude is exactly what we need.",
];

const generateMockEntries = (): DiaryEntry[] => {
  const entries: DiaryEntry[] = [];
  const today = new Date();
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip some days to make it more realistic
    if (Math.random() > 0.7 && i > 0) continue;
    
    entries.push({
      id: `entry-${i}`,
      date: date,
      mood: moodsList[Math.floor(Math.random() * moodsList.length)],
      videoUrl: `https://example.com/video-${i}.mp4`,
      thumbnailUrl: `https://images.unsplash.com/photo-${1500000000000 + i * 1000}?w=400&h=300&fit=crop`,
      transcript: transcripts[Math.floor(Math.random() * transcripts.length)],
      duration: Math.floor(Math.random() * 40) + 20, // 20-60 seconds
      createdAt: date,
    });
  }
  
  return entries;
};

export const mockEntries = generateMockEntries();

export const getMoodStats = (entries: DiaryEntry[]) => {
  const stats: Record<Mood, number> = {
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
    stats[entry.mood]++;
  });
  
  return stats;
};

export const getStreak = (entries: DiaryEntry[]): number => {
  if (entries.length === 0) return 0;
  
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    
    const hasEntry = sortedEntries.some(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === checkDate.getTime();
    });
    
    if (hasEntry) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  
  return streak;
};
