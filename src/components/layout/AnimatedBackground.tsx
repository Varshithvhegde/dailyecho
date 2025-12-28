import { useRef, useEffect } from "react";

export function AnimatedBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const { clientX, clientY } = e;
            const x = (clientX / window.innerWidth) * 20;
            const y = (clientY / window.innerHeight) * 20;
            containerRef.current.style.setProperty("--mouse-x", `${x}px`);
            containerRef.current.style.setProperty("--mouse-y", `${y}px`);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-[#FAFAF9] dark:bg-black"
        >
            {/* Decorative Grid */}
            <div
                className="absolute inset-0 opacity-[0.4]"
                style={{
                    backgroundImage: `radial-gradient(#CCC 1px, transparent 1px)`,
                    backgroundSize: `40px 40px`
                }}
            />

            {/* Main Gradient Blobs */}
            <div
                className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-coral/30 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob opacity-80"
                style={{ animationDelay: '0s', transform: 'translate(var(--mouse-x), var(--mouse-y))' }}
            />
            <div
                className="absolute top-[10%] right-[-20%] w-[60vw] h-[60vw] bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob opacity-80"
                style={{ animationDelay: '2s', transform: 'translate(calc(var(--mouse-x) * -1), var(--mouse-y))' }}
            />
            <div
                className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-orange-200/40 dark:bg-orange-900/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob opacity-80"
                style={{ animationDelay: '4s', transform: 'translate(calc(var(--mouse-x) * -1), calc(var(--mouse-y) * -1))' }}
            />

            {/* Accent Orbs */}
            <div className="absolute top-[40%] left-[10%] w-64 h-64 bg-yellow-200/30 rounded-full blur-[80px] animate-pulse-soft" />
            <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-sage/20 rounded-full blur-[100px] animate-pulse-soft" style={{ animationDelay: '1s' }} />

            {/* Noise Texture for that premium grain feel */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
            />
        </div>
    );
}
