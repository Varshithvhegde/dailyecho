import { MoodOption } from '@/types/diary';

export const moods: MoodOption[] = [
  { value: 'happy', label: 'Happy', emoji: '😊', color: 'bg-mood-happy' },
  { value: 'sad', label: 'Sad', emoji: '😢', color: 'bg-mood-sad' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', color: 'bg-mood-anxious' },
  { value: 'excited', label: 'Excited', emoji: '🎉', color: 'bg-mood-excited' },
  { value: 'calm', label: 'Calm', emoji: '😌', color: 'bg-mood-calm' },
  { value: 'stressed', label: 'Stressed', emoji: '😓', color: 'bg-mood-stressed' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏', color: 'bg-mood-grateful' },
  { value: 'reflective', label: 'Reflective', emoji: '🤔', color: 'bg-mood-reflective' },
];

export const dailyPrompts = [
  "What made you smile today?",
  "What's one thing you're grateful for right now?",
  "How are you really feeling today?",
  "What's something you accomplished recently?",
  "What's on your mind?",
  "What would make tomorrow great?",
  "What did you learn today?",
  "What's a challenge you're facing?",
];

export const getRandomPrompt = () => {
  return dailyPrompts[Math.floor(Math.random() * dailyPrompts.length)];
};

export const getMoodByValue = (value: string): MoodOption | undefined => {
  return moods.find(mood => mood.value === value);
};
