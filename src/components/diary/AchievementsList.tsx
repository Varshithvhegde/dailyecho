import { Award, Zap, Camera, Sun, Moon, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DiaryEntry } from '@/types/diary';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    progress: number;
    max: number;
    isUnlocked: boolean;
}

interface AchievementsListProps {
    entries: DiaryEntry[];
    streak: number;
}

export function AchievementsList({ entries, streak }: AchievementsListProps) {

    // Calculate stats
    const totalEntries = entries.length;
    const calmEntries = entries.filter(e => e.mood === 'calm').length;
    const happyEntries = entries.filter(e => e.mood === 'happy').length;
    const nightEntries = entries.filter(e => {
        const hour = new Date(e.date).getHours();
        return hour >= 22 || hour < 5;
    }).length;
    const morningEntries = entries.filter(e => {
        const hour = new Date(e.date).getHours();
        return hour >= 5 && hour < 10;
    }).length;
    const weekendEntries = entries.filter(e => {
        const day = new Date(e.date).getDay();
        return day === 0 || day === 6; // Sun or Sat
    }).length;

    const achievements: Achievement[] = [
        {
            id: 'first-step',
            title: 'First Step',
            description: 'Record your very first entry',
            icon: Camera,
            color: 'bg-blue-500',
            progress: totalEntries,
            max: 1,
            isUnlocked: totalEntries >= 1
        },
        {
            id: 'streak-master',
            title: 'Streak Master',
            description: 'Reach a 7 day streak',
            icon: Zap,
            color: 'bg-yellow-500',
            progress: streak,
            max: 7,
            isUnlocked: streak >= 7
        },
        {
            id: 'vlogger',
            title: 'Vlogger',
            description: 'Record 10 entries',
            icon: VideoIcon,
            color: 'bg-red-500',
            progress: totalEntries,
            max: 10,
            isUnlocked: totalEntries >= 10
        },
        {
            id: 'zen-master',
            title: 'Zen Master',
            description: 'Record 5 Calm entries',
            icon: Sun,
            color: 'bg-green-500',
            progress: calmEntries,
            max: 5,
            isUnlocked: calmEntries >= 5
        },
        {
            id: 'joy-seeker',
            title: 'Joy Seeker',
            description: 'Record 5 Happy entries',
            icon: Sparkles,
            color: 'bg-orange-400',
            progress: happyEntries,
            max: 5,
            isUnlocked: happyEntries >= 5
        },
        {
            id: 'night-owl',
            title: 'Night Owl',
            description: 'Record 3 entries late at night (after 10PM)',
            icon: Moon,
            color: 'bg-indigo-500',
            progress: nightEntries,
            max: 3,
            isUnlocked: nightEntries >= 3
        },
        {
            id: 'early-bird',
            title: 'Early Bird',
            description: 'Record 3 entries in the morning (before 10AM)',
            icon: Sun, // Using Sun again but different context
            color: 'bg-amber-400',
            progress: morningEntries,
            max: 3,
            isUnlocked: morningEntries >= 3
        },
        {
            id: 'weekend-warrior',
            title: 'Weekend Warrior',
            description: 'Record 3 entries on weekends',
            icon: Trophy,
            color: 'bg-purple-500',
            progress: weekendEntries,
            max: 3,
            isUnlocked: weekendEntries >= 3
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => {
                const Icon = achievement.icon;
                const percent = Math.min(100, Math.round((achievement.progress / achievement.max) * 100));

                return (
                    <div
                        key={achievement.id}
                        className={cn(
                            "p-4 rounded-xl border flex items-center gap-4 transition-all duration-300",
                            achievement.isUnlocked
                                ? "bg-card border-border/50 shadow-sm"
                                : "bg-muted/30 border-transparent opacity-70 grayscale"
                        )}
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                            achievement.isUnlocked ? achievement.color : "bg-gray-200 dark:bg-gray-800"
                        )}>
                            <Icon className={cn("w-6 h-6 text-white", !achievement.isUnlocked && "text-gray-400")} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className={cn("font-display font-semibold", achievement.isUnlocked ? "text-foreground" : "text-muted-foreground")}>
                                    {achievement.title}
                                </h4>
                                {achievement.isUnlocked && <Award className="w-4 h-4 text-yellow-500" />}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                {achievement.description}
                            </p>

                            {/* Progress Bar */}
                            <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-1000", achievement.color)}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                            <div className="mt-1 flex justify-end">
                                <span className="text-[10px] font-medium text-muted-foreground">
                                    {Math.min(achievement.progress, achievement.max)} / {achievement.max}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Helper component for Icon
function VideoIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m22 8-6 4 6 4V8Z" />
            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
        </svg>
    )
}
