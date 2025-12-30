import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Tag, Activity, Eye, Clock } from "lucide-react";
import type { Anime } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface LibraryAnalyticsProps {
    animeList: Anime[];
}

// Seaborn-inspired palettes (Deep, Muted, Pastel)
const COLORS = [
    "#4c72b0", "#dd8452", "#55a868", "#c44e52", "#8172b3",
    "#937860", "#da8bc3", "#8c8c8c", "#ccb974", "#64b5cd",
    "#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"
];

interface TagStat {
    name: string;
    total: number;
    watched: number;
    planned: number;
    x: number; // Random X Position (%)
    y: number; // Random Y Position (%)
    delay: number; // Animation Delay
}

export function LibraryAnalytics({ animeList }: LibraryAnalyticsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredTag, setHoveredTag] = useState<TagStat | null>(null);

    const stats = useMemo(() => {
        // Fallback Sample Data (If library is empty or has no tags)
        if (!animeList.length) {
            const sampleTags = [
                ["Action", 15, 10, 5], ["Adventure", 12, 4, 8], ["Fantasy", 10, 5, 5],
                ["Sci-Fi", 8, 2, 6], ["Drama", 7, 7, 0], ["Romance", 6, 3, 3],
                ["Slice of Life", 5, 1, 4], ["Comedy", 5, 2, 3], ["Thriller", 4, 4, 0],
                ["Mystery", 4, 2, 2], ["Supernatural", 3, 1, 2], ["Psychological", 3, 3, 0],
                ["Horror", 2, 0, 2], ["Mecha", 2, 1, 1], ["Sports", 1, 0, 1]
            ];

            return {
                sortedTags: sampleTags.map(([name, total, watched, planned], i) => ({
                    name: name as string,
                    total: total as number,
                    watched: watched as number,
                    planned: planned as number,
                    x: Math.random() * 80 + 10,
                    y: Math.random() * 80 + 10,
                    delay: i * 0.05
                })),
                maxCount: 15
            };
        }

        const tagMap: Record<string, { total: number, watched: number, planned: number }> = {};

        animeList.forEach(anime => {
            let tags: string[] = [];
            // Robust parsing
            if (Array.isArray(anime.tags)) tags = anime.tags;
            else if (typeof anime.tags === 'string') {
                try {
                    const parsed = JSON.parse(anime.tags);
                    if (Array.isArray(parsed)) tags = parsed;
                } catch {
                    tags = (anime.tags as string).split(',').map(t => t.trim());
                }
            }

            const isWatched = anime.category === "watched"; // Assuming 'category' field holds status or check other field

            tags.forEach((tag: string) => {
                const t = typeof tag === 'string' ? tag.trim() : "";
                if (t) {
                    if (!tagMap[t]) tagMap[t] = { total: 0, watched: 0, planned: 0 };
                    tagMap[t].total++;
                    if (isWatched) tagMap[t].watched++;
                    else tagMap[t].planned++;
                }
            });
        });

        const sortedTagsRaw = Object.entries(tagMap)
            .sort(([, a], [, b]) => b.total - a.total)
            .slice(0, 30)
            .map(([name, data]) => ({ name, ...data }));

        const maxCount = sortedTagsRaw[0]?.total || 1;

        // Packing Algorithm for non-overlapping organic layout
        const placedBubbles: { x: number; y: number; r: number }[] = [];
        const CANVAS_WIDTH = 1000; // Abstract units
        const CANVAS_HEIGHT = 800;

        const packedTags = sortedTagsRaw.map((tag, i) => {
            const percent = tag.total / maxCount;
            // Estimated radius in abstract units (relative to CANVAS)
            // Visual size is 70-200px. Assume canvas matches rough pixel size of container interactively.
            const sizePx = Math.max(70, Math.min(200, percent * 250));
            const radius = (sizePx / 2) + 10; // +10 padding

            let bestX = 500;
            let bestY = 400;
            let attempts = 0;
            const maxAttempts = 200;
            let foundSpot = false;

            // Spiral Search or Randomized Retry
            while (attempts < maxAttempts) {
                // Bounds Calculation:
                // We want the ENTIRE bubble to be inside.
                // The bubble extends 'radius' amount from the center 'x'.
                // So 'x' cannot be less than 'radius' and cannot be more than 'WIDTH - radius'.
                // Adding extra 10px buffer for shadows/strokes.
                // BOTTOM FIX: Extra buffer for bottom edge to prevent clipping.
                const safeBuffer = radius + 20;
                const bottomBuffer = safeBuffer + 60; // Extra 60 units from bottom

                const x = Math.random() * (CANVAS_WIDTH - safeBuffer * 2) + safeBuffer;
                const y = Math.random() * (CANVAS_HEIGHT - safeBuffer - bottomBuffer) + safeBuffer;

                // Collision Check
                let collision = false;
                for (const existing of placedBubbles) {
                    const dx = x - existing.x;
                    const dy = y - existing.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    // Strict check
                    if (distance < (radius + existing.r + 5)) {
                        collision = true;
                        break;
                    }
                }

                if (!collision) {
                    bestX = x;
                    bestY = y;
                    foundSpot = true;
                    break;
                }
                attempts++;
            }

            if (!foundSpot) return null;

            placedBubbles.push({ x: bestX, y: bestY, r: radius });

            return {
                ...tag,
                // Convert back to % for responsive CSS (Corner = Center - Radius)
                // Visual radius is sizePx / 2
                x: ((bestX - sizePx / 2) / CANVAS_WIDTH) * 100,
                y: ((bestY - sizePx / 2) / CANVAS_HEIGHT) * 100,
                delay: i * 0.05
            };
        }).filter(Boolean) as any[];


        return {
            sortedTags: packedTags,
            maxCount
        };
    }, [animeList]);

    return (
        <>
            <div className="z-[100]">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(true)}
                    className="rounded-full gap-2 hover:bg-purple-500/10 hover:text-purple-400 transition-all text-xs font-medium px-4 text-white"
                >
                    <Activity className="w-3.5 h-3.5 text-purple-500" />
                    <span className="hidden sm:inline">Analytics</span>
                </Button>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="bg-zinc-950/95 border-white/10 text-white sm:max-w-5xl h-[85vh] overflow-hidden flex flex-col p-0">
                    <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-transparent flex justify-between items-center z-20 relative">
                        <DialogTitle className="flex items-center gap-3 text-xl font-display tracking-tight">
                            <BarChart3 className="w-6 h-6 text-purple-400" />
                            Library DNA
                            <span className="text-xs font-mono text-white/40 mt-1 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                                {animeList.length || "Empty"} Items
                            </span>
                        </DialogTitle>
                        <div className="text-xs text-white/30 font-mono hidden sm:block">
                            Size = Popularity • Position = Random
                        </div>
                    </div>

                    <div className="flex-1 relative overflow-hidden bg-zinc-950">
                        {/* Background Grid */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-zinc-950 to-zinc-950 pointer-events-none" />

                        {stats && stats.sortedTags.length > 0 ? (
                            <div className="w-full h-full relative">
                                {stats.sortedTags.map((tag, index) => {
                                    const percent = tag.total / stats.maxCount;
                                    const size = Math.max(70, Math.min(200, percent * 250)); // Larger bubbles
                                    const color = COLORS[index % COLORS.length];

                                    return (
                                        <TooltipProvider key={tag.name}>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <motion.div
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{
                                                            scale: [1, 1.05, 1], // Breathing effect
                                                            opacity: 0.9,
                                                            left: `${tag.x}%`,
                                                            top: `${tag.y}%`
                                                        }}
                                                        transition={{
                                                            scale: {
                                                                repeat: Infinity,
                                                                duration: 4 + Math.random() * 2,
                                                                ease: "easeInOut",
                                                                delay: Math.random() * 2
                                                            },
                                                            default: {
                                                                type: "spring",
                                                                stiffness: 100,
                                                                damping: 15,
                                                                delay: tag.delay
                                                            }
                                                        }}
                                                        whileHover={{ scale: 1.1, zIndex: 50, opacity: 1 }}
                                                        drag
                                                        dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
                                                        dragElastic={0.2}
                                                        style={{
                                                            width: size,
                                                            height: size,
                                                            position: 'absolute',
                                                            // left/top animated above
                                                            background: `radial-gradient(circle at 30% 30%, ${color}dd, ${color}66)`,
                                                            boxShadow: `0 0 30px ${color}33, inset 0 0 20px ${color}aa`,
                                                        }}
                                                        className="rounded-full flex flex-col justify-center items-center text-center cursor-pointer backdrop-blur-md border border-white/10"
                                                    >

                                                        <span className="font-bold text-white text-shadow-sm px-2 text-sm md:text-base pointer-events-none drop-shadow-md leading-tight">
                                                            {tag.name}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-white/80 bg-black/20 px-1.5 py-0.5 rounded-full mt-1 backdrop-blur-md pointer-events-none">
                                                            {tag.total}
                                                        </span>
                                                    </motion.div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="z-[200] bg-black/90 border-white/10 backdrop-blur-xl p-3 shadow-2xl rounded-xl">
                                                    <div className="flex flex-col gap-2 min-w-[140px]">
                                                        <div className="font-bold text-white border-b border-white/10 pb-1 mb-1 flex justify-between items-center">
                                                            {tag.name}
                                                            <span className="text-xs bg-white/10 px-1.5 rounded">{tag.total}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs text-gray-300">
                                                            <span className="flex items-center gap-1.5"><Eye className="w-3 h-3 text-green-400" /> Watched</span>
                                                            <span className="font-mono text-white">{tag.watched}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs text-gray-300">
                                                            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-amber-400" /> Plan to Watch</span>
                                                            <span className="font-mono text-white">{tag.planned}</span>
                                                        </div>
                                                        {/* Mini Bar */}
                                                        <div className="h-1 w-full flex mt-1 rounded-full overflow-hidden bg-white/5">
                                                            <div style={{ width: `${(tag.watched / tag.total) * 100}%` }} className="h-full bg-green-500/80" />
                                                            <div style={{ width: `${(tag.planned / tag.total) * 100}%` }} className="h-full bg-amber-500/80" />
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-white/40 font-mono">
                                No data available.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
