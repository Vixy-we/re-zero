import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, Search, Plus, X, ThumbsUp, ThumbsDown, Sparkles, Filter, Library, Trash2, BrainCircuit, MonitorOff } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAnimeList } from "@/hooks/use-anime";
import { AnimeCard } from "@/components/AnimeCard";
import type { Anime } from "@shared/schema";
import { AddAnimeDialog } from "@/components/AddAnimeDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useJikanAnimeById } from "@/hooks/use-anime";

// Helper component for sidebar items to fetch score
const SidebarAnimeItem = ({ anime, onDragStart, onClick }: { anime: Anime, onDragStart: (e: React.DragEvent, anime: Anime) => void, onClick: () => void }) => {
    const { data: jikanData } = useJikanAnimeById(anime.malId || null);

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, anime)}
            onClick={onClick}
            className="p-2 bg-white/5 rounded-xl border border-white/5 hover:border-primary/50 hover:bg-primary/10 cursor-grab active:cursor-grabbing transition-all flex gap-3 group relative overflow-hidden"
        >
            <div className="w-12 h-16 flex-shrink-0 relative">
                <img src={anime.imageUrl || ""} className="w-full h-full object-cover rounded-md shadow-sm" />
            </div>

            <div className="flex-1 overflow-hidden flex flex-col justify-center">
                <p className="text-sm font-bold truncate group-hover:text-primary transition-colors pr-4">{anime.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-bold text-yellow-400 flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3 fill-current" /> {anime.rating || "-"}
                    </span>
                    <span className="text-xs text-muted-foreground/50">•</span>
                    <span className="text-xs bg-white/5 border border-white/5 px-2 py-0.5 rounded text-muted-foreground flex items-center gap-1">
                        Global: {jikanData?.score ? jikanData.score : <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />}
                    </span>
                    <span className="text-xs text-muted-foreground/50">•</span>
                    <span className="text-xs text-muted-foreground">{anime.releaseYear}</span>
                </div>
            </div>

            <Plus className="w-4 h-4 text-primary absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all scale-75 hover:scale-100" />
        </div>
    )
}

export default function SmartSuggestions() {
    const isMobile = useIsMobile();
    const { data: libraryList } = useAnimeList();

    // UI State
    const [activeTab, setActiveTab] = useState<"library">("library");

    // Logic State
    const [searchQuery, setSearchQuery] = useState("");
    const [likedAnime, setLikedAnime] = useState<Anime[]>([]);
    const [dislikedAnime, setDislikedAnime] = useState<Anime[]>([]);

    // Results State
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedJikanAnime, setSelectedJikanAnime] = useState<any | null>(null);
    const [detailsLoadingId, setDetailsLoadingId] = useState<number | null>(null);

    const handleCardClick = async (anime: any) => {
        if (!anime.malId && !anime.mal_id) return;
        const id = anime.malId || anime.mal_id;

        setDetailsLoadingId(id);
        try {
            // Fetch full details
            const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
            const data = await res.json();

            if (data.data) {
                setSelectedJikanAnime(data.data);
            } else {
                // Fallback to minimal data if fetch fails
                setSelectedJikanAnime(anime);
            }
        } catch (e) {
            console.error(e);
            setSelectedJikanAnime(anime);
        } finally {
            setDetailsLoadingId(null);
        }
    };

    // Filter library based on search - WATCHED ONLY
    const filteredLibrary = libraryList?.filter(a =>
        a.category === 'watched' &&
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !likedAnime.find(l => l.id === a.id) &&
        !dislikedAnime.find(l => l.id === a.id)
    ) || [];

    const handleDragStart = (e: React.DragEvent, anime: Anime) => {
        e.dataTransfer.setData("animeId", anime.id.toString());
    };

    const handleDropLike = (e: React.DragEvent) => {
        e.preventDefault();
        const animeId = parseInt(e.dataTransfer.getData("animeId"));
        const anime = libraryList?.find(a => a.id === animeId);
        if (anime && !likedAnime.find(l => l.id === animeId)) {
            setLikedAnime([...likedAnime, anime]);
            setDislikedAnime(prev => prev.filter(d => d.id !== animeId));
        }
    };

    const handleDropDislike = (e: React.DragEvent) => {
        e.preventDefault();
        const animeId = parseInt(e.dataTransfer.getData("animeId"));
        const anime = libraryList?.find(a => a.id === animeId);
        if (anime && !dislikedAnime.find(l => l.id === animeId)) {
            setDislikedAnime([...dislikedAnime, anime]);
            setLikedAnime(prev => prev.filter(l => l.id !== animeId));
        }
    };

    const generateRecommendations = async () => {
        if (likedAnime.length === 0) return;

        setIsGenerating(true);
        setRecommendations([]);

        try {
            // STEP 1: Fetch Recommendations for ALL liked anime in parallel
            const promises = likedAnime.map(anime =>
                fetch(`https://api.jikan.moe/v4/anime/${anime.malId}/recommendations`)
                    .then(res => res.json())
                    .then(data => ({ sourceId: anime.malId, recs: data.data || [] }))
                    .catch(err => ({ sourceId: anime.malId, recs: [] }))
            );

            const allResults = await Promise.all(promises);

            // STEP 2: Aggregate & Score
            // Map<AnimeID, { data: AnimeData, score: number, sources: number[] }>
            const scoreMap = new Map<number, { data: any, score: number, votes: number, sources: number[] }>();

            const libraryMalIds = new Set(libraryList?.map(a => a.malId));
            const dislikedMalIds = new Set(dislikedAnime.map(a => a.malId));

            allResults.forEach(({ sourceId, recs }) => {
                recs.forEach((rec: any) => {
                    const anime = rec.entry;
                    const votes = rec.votes || 0;

                    // Exclude invalid
                    if (libraryMalIds.has(anime.mal_id)) return;
                    if (dislikedMalIds.has(anime.mal_id)) return;

                    if (!scoreMap.has(anime.mal_id)) {
                        scoreMap.set(anime.mal_id, {
                            data: anime,
                            score: 0,
                            votes: 0,
                            sources: []
                        });
                    }

                    const entry = scoreMap.get(anime.mal_id)!;
                    entry.votes += votes;
                    entry.sources.push(sourceId);

                    // SCORING LOGIC
                    // 1. Frequency Boost: +10 points for every source that recommends it
                    // 2. Popularity Boost: +1 point per 10 votes
                    entry.score += 10 + (votes / 10);
                });
            });

            // STEP 3: Convert to Array & Sort
            const sortedRecs = Array.from(scoreMap.values())
                .sort((a, b) => b.score - a.score)
                .slice(0, 20) // Top 20
                .map(item => ({
                    ...item.data,
                    smart_score: Math.round(item.score),
                    source_count: item.sources.length,
                    total_votes: item.votes
                }));

            // Hydrate with full details (Optional, but Jikan Recs endpoint only gives basic info. 
            // Often "entry" has title/images but misses "score/type".
            // For now, we use what we have, or could fetch details for top 5.
            // "entry" in Recommendations usually has: mal_id, url, images, title.
            // Missing: synopsis, score, type, year. 
            // We can do a second pass fetching? Or just display basic info.
            // Let's stick to basic info for speed, as 20 fetches is too many.

            setRecommendations(sortedRecs);

        } catch (error) {
            console.error("Failed to generate smart recommendations", error);
        } finally {
            setIsGenerating(false);
        }
    };



    if (isMobile) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black text-white p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
                        <MonitorOff className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold">Incompatible with Phone</h2>
                    <p className="text-muted-foreground text-sm max-w-[250px]">
                        The Smart Engine requires a larger screen for the best experience. Please use a PC.
                    </p>
                    <Link href="/">
                        <Button variant="outline" className="mt-4">Return Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans">
            <AddAnimeDialog
                isOpen={!!selectedJikanAnime}
                onOpenChange={(v) => !v && setSelectedJikanAnime(null)}
                initialAnime={selectedJikanAnime}
                trigger={<span className="hidden" />}
            />

            {/* SIDEBAR */}
            <div className="w-[360px] flex-shrink-0 border-r border-white/5 bg-secondary/20 flex flex-col h-full z-20 shadow-2xl">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-bold tracking-tight">Smart Engine</span>
                            <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <BrainCircuit className="w-3 h-3" /> AI
                            </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">Collaborative Filtering</span>
                    </div>
                </div>

                {/* Library Source Only */}
                <div className="flex-1 overflow-hidden relative flex flex-col p-4">
                    <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-3 mb-4 text-xs text-purple-200">
                        <p className="font-bold mb-1">How it works:</p>
                        <p className="opacity-70">Drag your **Favorites** to the Right. We analyze thousands of user lists to find what they recommended based on your picks.</p>
                    </div>

                    <Input
                        placeholder="Search favorites..."
                        className="bg-black/20 border-white/10 mb-4"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <ScrollArea className="flex-1 -mr-3 pr-3">
                        <div className="space-y-2 pb-4">
                            {filteredLibrary.length === 0 && (
                                <div className="text-center text-muted-foreground text-xs py-10 opacity-50">
                                    No watched anime found.
                                </div>
                            )}
                            {filteredLibrary.map(anime => (
                                <SidebarAnimeItem
                                    key={anime.id}
                                    anime={anime}
                                    onDragStart={handleDragStart}
                                    onClick={() => {
                                        if (!likedAnime.find(l => l.id === anime.id) && !dislikedAnime.find(d => d.id === anime.id)) {
                                            setLikedAnime([...likedAnime, anime]);
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* MAIN CONTENT Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-background/50">

                {/* RECIPE BAR (TOP) */}
                <div className="h-[140px] flex-shrink-0 border-b border-white/5 bg-background/80 backdrop-blur-xl flex items-center px-6 gap-6 relative z-10">

                    {/* BUCKET: LIKES */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropLike}
                        className="flex-1 h-[100px] rounded-xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all flex flex-col relative overflow-hidden group"
                    >
                        <div className="absolute top-2 left-3 text-xs font-bold text-muted-foreground uppercase tracking-widest pointer-events-none flex items-center gap-2">
                            <ThumbsUp className="w-3 h-3 text-purple-400" /> Source Material (Favorites)
                        </div>
                        {likedAnime.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 text-xs italic pointer-events-none">
                                Drag absolute favorites here
                            </div>
                        ) : (
                            <TooltipProvider>
                                <div className="flex items-center gap-2 p-2 pt-8 overflow-x-auto px-4 no-scrollbar h-full">
                                    {likedAnime.map(anime => (
                                        <Tooltip key={anime.id}>
                                            <TooltipTrigger asChild>
                                                <motion.div
                                                    layout
                                                    className="relative flex-shrink-0 group/item cursor-help"
                                                >
                                                    <img src={anime.imageUrl || ""} className="w-10 h-14 object-cover rounded border border-white/20 shadow-sm" />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setLikedAnime(prev => prev.filter(l => l.id !== anime.id));
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/item:opacity-100 transition-all scale-75 hover:scale-100 z-10"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </motion.div>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-black/90 border-white/10 text-white text-xs font-bold">
                                                <p>{anime.title}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                            </TooltipProvider>
                        )}
                    </div>

                    {/* ACTION BUTTON */}
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Button
                            size="lg"
                            onClick={generateRecommendations}
                            disabled={isGenerating || likedAnime.length === 0}
                            className="h-16 w-16 rounded-full shadow-2xl shadow-purple-500/20 bg-gradient-to-br from-purple-500 to-indigo-600 hover:scale-105 transition-all p-0 flex flex-col items-center justify-center gap-1"
                        >
                            {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <BrainCircuit className="w-6 h-6" />}
                        </Button>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-70">Analyze</span>
                    </div>
                </div>

                {/* RESULTS GRID */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold tracking-tight">AI Recommendations</h2>
                            <div className="flex gap-2">
                                <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/5 text-muted-foreground">
                                    {recommendations.length} items
                                </span>
                            </div>
                        </div>

                        {recommendations.length === 0 && !isGenerating && (
                            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground opacity-30 gap-4">
                                <div className="w-24 h-24 rounded-full border-4 border-dashed border-current flex items-center justify-center">
                                    <BrainCircuit className="w-10 h-10" />
                                </div>
                                <p className="text-lg">Feed the AI at least one favorite anime</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {recommendations.map((anime, idx) => (
                                <motion.div
                                    key={anime.mal_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <div className="absolute top-2 right-2 z-10 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">
                                        Match: {anime.smart_score}
                                    </div>
                                    {detailsLoadingId === anime.mal_id && (
                                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 rounded-lg backdrop-blur-[2px]">
                                            <div className="relative flex flex-col items-center gap-2">
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.2, 1],
                                                        opacity: [0.5, 1, 0.5],
                                                        filter: ["brightness(1)", "brightness(2)", "brightness(1)"]
                                                    }}
                                                    transition={{
                                                        duration: 1.5,
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                >
                                                    <BrainCircuit className="w-8 h-8 text-purple-400" />
                                                </motion.div>
                                                <motion.span
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-[10px] font-mono text-purple-300 tracking-wider"
                                                >
                                                    ANALYZING...
                                                </motion.span>
                                            </div>
                                        </div>
                                    )}
                                    <AnimeCard
                                        anime={{
                                            id: -anime.mal_id,
                                            malId: anime.mal_id,
                                            title: anime.title,
                                            imageUrl: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
                                            rating: null,
                                            episodes: null,
                                            tags: [],
                                            createdAt: new Date(),
                                            category: "suggestion",
                                            notes: `${anime.total_votes} users recommended this based on ${anime.source_count} of your favorites.`,
                                            description: null,
                                            type: null,
                                            duration: null,
                                            releaseYear: null
                                        }}
                                        onClick={() => handleCardClick(anime)}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
