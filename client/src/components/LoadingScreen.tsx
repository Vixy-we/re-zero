import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Loader2, Terminal } from "lucide-react";

export function LoadingScreen() {
    const [isVisible, setIsVisible] = useState(true);
    const [countdown, setCountdown] = useState(5);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Determine visibility from session storage to show only once per session?
        // User requested "prevent this when the site is opened". 
        // Usually means first load or refresh. Let's just do it on mount.

        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setTimeout(() => setIsVisible(false), 500); // Disappear after 0
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Smooth progress bar
        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + 2, 100)); // ~50 ticks * 100ms = 5s
        }, 100);

        return () => {
            clearInterval(interval);
            clearInterval(progressInterval);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center text-white"
        >
            <div className="w-full max-w-sm space-y-8 p-6 text-center">
                {/* Identity / Logo Area */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                        <Terminal className="w-16 h-16 text-primary relative z-10" />
                    </div>
                    <h1 className="text-3xl font-display font-bold tracking-tight">
                        SHELF <span className="text-primary">OS</span>
                    </h1>
                </motion.div>

                {/* Status Text & Countdown */}
                <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm font-mono text-muted-foreground uppercase tracking-widest">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>System Initializing...</span>
                    </div>
                    <div className="text-6xl font-mono font-bold text-white/10 select-none">
                        0{countdown}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="absolute top-0 bottom-0 left-0 bg-primary shadow-[0_0_10px_var(--primary)]"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "linear" }}
                    />
                </div>
                <p className="text-xs text-white/20 font-mono pt-4">
                    Optimizing Neural Connections...
                </p>
            </div>
        </motion.div>
    );
}
