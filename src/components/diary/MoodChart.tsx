import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Mood } from '@/types/diary';
import { getMoodByValue } from '@/data/moods';

interface MoodChartProps {
  moodStats: Record<Mood, number>;
}

const MOOD_COLORS: Record<Mood, string> = {
  happy: '#EAB308',
  sad: '#3B82F6',
  anxious: '#F59E0B',
  excited: '#EC4899',
  calm: '#06B6D4',
  stressed: '#EF4444',
  grateful: '#10B981',
  reflective: '#8B5CF6',
};

export function MoodChart({ moodStats }: MoodChartProps) {
  const data = Object.entries(moodStats)
    .filter(([_, count]) => count > 0)
    .map(([mood, count]) => {
      const moodOption = getMoodByValue(mood);
      return {
        name: moodOption?.label || mood,
        value: count,
        emoji: moodOption?.emoji || '',
        color: MOOD_COLORS[mood as Mood],
      };
    });

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No mood data yet. Start recording!</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card px-3 py-2 shadow-soft">
          <p className="text-sm font-medium">
            {data.emoji} {data.name}: {data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {entry.payload.emoji} {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={4}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderCustomLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
}
