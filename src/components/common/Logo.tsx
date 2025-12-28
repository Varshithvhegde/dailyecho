import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    classNameText?: string;
    showText?: boolean;
}

export function Logo({ className, classNameText, showText = true }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            <div className="relative flex items-center justify-center w-10 h-10 bg-coral text-white rounded-xl shadow-lg shadow-coral/20 overflow-hidden group">

                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-coral via-orange-400 to-coral opacity-100 group-hover:scale-110 transition-transform duration-500" />

                {/* Echo Waves Icon */}
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-6 h-6 relative z-10 transform group-hover:scale-105 transition-transform"
                >
                    {/* Central 'recording' dot / pulse */}
                    <circle cx="12" cy="12" r="3" fill="currentColor" className="animate-pulse" />

                    {/* Echo Rings */}
                    <path
                        d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="opacity-60"
                    />
                    <path
                        d="M19 12C19 8.13401 15.866 5 12 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="opacity-40"
                    />
                    {/* Outer partial ring for dynamic look */}
                    <path
                        d="M17 17L18.5 18.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="opacity-80"
                    />
                </svg>
            </div>

            {showText && (
                <div className={cn("flex flex-col", classNameText)}>
                    <span className="font-display font-bold text-xl leading-none tracking-tight text-foreground">
                        Daily Echo
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase">
                        Video Journal
                    </span>
                </div>
            )}
        </div>
    );
}
