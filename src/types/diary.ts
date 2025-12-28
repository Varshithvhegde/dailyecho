export type Mood =
  | 'happy'
  | 'sad'
  | 'anxious'
  | 'excited'
  | 'calm'
  | 'stressed'
  | 'grateful'
  | 'reflective';

export interface MoodOption {
  value: Mood;
  label: string;
  emoji: string;
  color: string;
}

export interface AIAnalysis {
  title: string;
  summary: string;
  emotional_analysis: string;
  key_topics: string[];
  advice: string;
  sentiment_score: number;
}

export interface DiaryEntry {
  id: string;
  date: Date;
  mood: Mood;
  videoUrl?: string;
  thumbnailUrl?: string;
  transcript?: string;
  duration: number;
  createdAt: Date;
  ai_analysis?: AIAnalysis | null;
}

export interface DailyPrompt {
  id: string;
  text: string;
  category: string;
}
