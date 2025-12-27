import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, Search, Plus, X, ThumbsUp, ThumbsDown, Sparkles, Filter, Library, Trash2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAnimeList } from "@/hooks/use-anime";
import { AnimeCard } from "@/components/AnimeCard";
import type { Anime } from "@shared/schema";
import { AddAnimeDialog } from "@/components/AddAnimeDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Commonly used genres with their MAL IDs (Jikan API) - Expanded List
const GENRES = [
    { id: 1, name: "Action" },
    { id: 2, name: "Adventure" },
    { id: 4, name: "Comedy" },
    { id: 8, name: "Drama" },
    { id: 10, name: "Fantasy" },
    { id: 14, name: "Horror" },
    { id: 7, name: "Mystery" },
    { id: 22, name: "Romance" },
    { id: 24, name: "Sci-Fi" },
    { id: 36, name: "Slice of Life" },
    { id: 30, name: "Sports" },
    { id: 37, name: "Supernatural" },
    { id: 41, name: "Thriller" },
    { id: 42, name: "Seinen" },
    { id: 27, name: "Shounen" },
    { id: 25, name: "Shoujo" },
    { id: 43, name: "Josei" },
    { id: 18, name: "Mecha" },
    { id: 40, name: "Psychological" },
    { id: 19, name: "Music" },
    { id: 9, name: "Ecchi" },
    { id: 62, name: "Isekai" },
    { id: 46, name: "Award Winning" },
];

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

const getGenreId = (name: string) => {
    const match = GENRES.find(g => g.name.toLowerCase() === name.toLowerCase());
    return match ? match.id : null;
};

export default function Suggestions() {
    const { data: libraryList } = useAnimeList();

    // UI State
    const [activeTab, setActiveTab] = useState<"library" | "filters">("library");

    // Logic State
    const [searchQuery, setSearchQuery] = useState("");
    const [likedAnime, setLikedAnime] = useState<Anime[]>([]);
    const [dislikedAnime, setDislikedAnime] = useState<Anime[]>([]);
    const [dislikedGenres, setDislikedGenres] = useState<number[]>([]);
    const [likedGenres, setLikedGenres] = useState<number[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);

    // Results State
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedJikanAnime, setSelectedJikanAnime] = useState<any | null>(null);

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

    const toggleGenre = (id: number, type: 'like' | 'dislike') => {
        if (type === 'like') {
            if (likedGenres.includes(id)) {
                setLikedGenres(prev => prev.filter(g => g !== id));
            } else {
                setLikedGenres(prev => [...prev, id]);
                setDislikedGenres(prev => prev.filter(g => g !== id));
            }
        } else {
            if (dislikedGenres.includes(id)) {
                setDislikedGenres(prev => prev.filter(g => g !== id));
            } else {
                setDislikedGenres(prev => [...prev, id]);
                setLikedGenres(prev => prev.filter(g => g !== id));
            }
        }
    };

    const generateRecommendations = async () => {
        setIsGenerating(true);
        try {
            let newRecs = [];

            // STRATEGY 1: Smart Similarity (DISABLED for legacy mode)
            if (false) {
                console.log("Using Smart Suggestion Engine...");

                // Fetch Recommendations for ALL liked anime in parallel
                const promises = likedAnime.map(anime =>
                    fetch(`https://api.jikan.moe/v4/anime/${anime.malId}/recommendations`)
                        .then(res => res.json())
                        .then(data => ({ sourceId: anime.malId, recs: data.data || [] }))
                        .catch(err => ({ sourceId: anime.malId, recs: [] }))
                );

                const allResults = await Promise.all(promises);

                // Aggregate & Score
                const scoreMap = new Map();
                const libraryMalIds = new Set(libraryList?.map(a => a.malId));
                const dislikedMalIds = new Set(dislikedAnime.map(a => a.malId));

                allResults.forEach(({ sourceId, recs }) => {
                    recs.forEach((rec: any) => {
                        const anime = rec.entry;
                        const votes = rec.votes || 0;

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

                        const entry = scoreMap.get(anime.mal_id);
                        entry.votes += votes;
                        entry.sources.push(sourceId);
                        entry.score += 10 + (votes / 10);
                    });
                });

                newRecs = Array.from(scoreMap.values())
                    .sort((a: any, b: any) => b.score - a.score)
                    .slice(0, 20)
                    .map((item: any) => ({
                        ...item.data,
                        smart_score: Math.round(item.score),
                        source_count: item.sources.length,
                        total_votes: item.votes
                    }));
            }

            // STRATEGY 2: Legacy Genre Filtering (Always Active)
            if (true) {
                console.log("Using Fallback Genre Engine...");
                const explicitLiked = new Set(likedGenres);
                const explicitDisliked = new Set(dislikedGenres);

                likedAnime.forEach(anime => {
                    anime.tags?.forEach(tag => {
                        const id = getGenreId(tag);
                        if (id && !explicitDisliked.has(id)) explicitLiked.add(id);
                    });
                });

                dislikedAnime.forEach(anime => {
                    anime.tags?.forEach(tag => {
                        const id = getGenreId(tag);
                        if (id && !explicitLiked.has(id)) explicitDisliked.add(id);
                    });
                });

                const genreQuery = Array.from(explicitLiked).join(',');
                const excludeQuery = Array.from(explicitDisliked).join(',');

                let url = `https://api.jikan.moe/v4/anime?order_by=popularity&sfw=true&min_score=7`;

                if (explicitLiked.size > 0) url += `&genres=${genreQuery}`;
                if (explicitDisliked.size > 0) url += `&genres_exclude=${excludeQuery}`;
                if (selectedType) url += `&type=${selectedType}`;

                const response = await fetch(url);
                const data = await response.json();
                newRecs = data.data || [];
            }

            // Common Deduplication (Filter out Library items)
            const libraryMalIds = new Set(libraryList?.map(a => a.malId));
            const filteredRecs = newRecs.filter((a: any) => !libraryMalIds.has(a.mal_id));

            setRecommendations(filteredRecs);

        } catch (error) {
            console.error("Failed to generate recommendations", error);
        } finally {
            setIsGenerating(false);
        }
    };

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
                    <div className="flex items-center gap-2">
                        <span className="font-bold tracking-tight">Suggestions</span>
                        <span className="text-[10px] bg-primary/20 text-primary border border-primary/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FlaskConical className="w-3 h-3" /> Beta
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-2 p-2 gap-2 bg-black/10 m-4 rounded-xl">
                    <button
                        onClick={() => setActiveTab("library")}
                        className={`py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "library" ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:bg-white/5"}`}
                    >
                        <Library className="w-4 h-4" /> Library
                    </button>
                    <button
                        onClick={() => setActiveTab("filters")}
                        className={`py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "filters" ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:bg-white/5"}`}
                    >
                        <Filter className="w-4 h-4" /> Filters
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {activeTab === "library" ? (
                            <motion.div
                                key="library"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="absolute inset-0 flex flex-col p-4 pt-0"
                            >
                                <Input
                                    placeholder="Search watched..."
                                    className="bg-black/20 border-white/10 mb-4"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <ScrollArea className="flex-1 -mr-3 pr-3">
                                    <div className="space-y-2 pb-4">
                                        {filteredLibrary.length === 0 && (
                                            <div className="text-center text-muted-foreground text-xs py-10 opacity-50">
                                                No watched anime found needing suggestions.
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
                            </motion.div>
                        ) : (
                            <motion.div
                                key="filters"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="absolute inset-0 flex flex-col p-4 pt-0 overflow-y-auto"
                            >
                                <div className="space-y-6">
                                    {/* Format */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Format</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {['tv', 'movie', 'ova', 'special', 'ona', 'music'].map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => setSelectedType(selectedType === type ? null : type)}
                                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all
                                                        ${selectedType === type
                                                            ? 'bg-primary text-primary-foreground border-primary'
                                                            : 'bg-black/20 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20'}`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Genres */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Refine by Genre</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {GENRES.map(genre => (
                                                <div key={genre.id} className="flex items-center rounded-lg border border-white/10 bg-black/20 overflow-hidden">
                                                    <button
                                                        onClick={() => toggleGenre(genre.id, 'like')}
                                                        className={`px-3 py-1.5 text-xs font-bold transition-all hover:bg-white/5 border-r border-white/5
                                                            ${likedGenres.includes(genre.id)
                                                                ? 'bg-green-500/20 text-green-400 border-green-500/20'
                                                                : 'text-muted-foreground'}`}
                                                    >
                                                        {genre.name}
                                                    </button>
                                                    <button
                                                        onClick={() => toggleGenre(genre.id, 'dislike')}
                                                        className={`px-2 py-1.5 transition-all hover:bg-white/5
                                                            ${dislikedGenres.includes(genre.id)
                                                                ? 'bg-red-500/20 text-red-400'
                                                                : 'text-muted-foreground hover:text-red-400'}`}
                                                    >
                                                        <ThumbsDown className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                        className="flex-1 h-[100px] rounded-xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all flex flex-col relative overflow-hidden group"
                    >
                        <div className="absolute top-2 left-3 text-xs font-bold text-muted-foreground uppercase tracking-widest pointer-events-none flex items-center gap-2">
                            <ThumbsUp className="w-3 h-3 text-green-400" /> Like
                        </div>
                        {likedAnime.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 text-xs italic pointer-events-none">
                                Drag favorites here
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
                            disabled={isGenerating || (likedAnime.length === 0 && likedGenres.length === 0 && dislikedAnime.length === 0 && dislikedGenres.length === 0)}
                            className="h-16 w-16 rounded-full shadow-2xl shadow-primary/20 bg-gradient-to-br from-primary to-purple-600 hover:scale-105 transition-all p-0 flex flex-col items-center justify-center gap-1"
                        >
                            {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                        </Button>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-70">Generate</span>
                    </div>

                    {/* BUCKET: DISLIKES */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropDislike}
                        className="flex-1 h-[100px] rounded-xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-red-500/30 transition-all flex flex-col relative overflow-hidden"
                    >
                        <div className="absolute top-2 left-3 text-xs font-bold text-muted-foreground uppercase tracking-widest pointer-events-none flex items-center gap-2">
                            <ThumbsDown className="w-3 h-3 text-red-400" /> Dislike
                        </div>
                        {dislikedAnime.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 text-xs italic pointer-events-none">
                                Drag avoids here
                            </div>
                        ) : (
                            <TooltipProvider>
                                <div className="flex items-center gap-2 p-2 pt-8 overflow-x-auto px-4 no-scrollbar h-full">
                                    {dislikedAnime.map(anime => (
                                        <Tooltip key={anime.id}>
                                            <TooltipTrigger asChild>
                                                <motion.div
                                                    layout
                                                    className="relative flex-shrink-0 group/item cursor-help"
                                                >
                                                    <img src={anime.imageUrl || ""} className="w-10 h-14 object-cover rounded border border-white/20 shadow-sm opacity-60 grayscale" />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent tooltip toggle? No, prevent drag issues maybe
                                                            setDislikedAnime(prev => prev.filter(l => l.id !== anime.id));
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
                </div>

                {/* RESULTS GRID */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold tracking-tight">Suggestions Results</h2>
                            <div className="flex gap-2">
                                <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/5 text-muted-foreground">
                                    {recommendations.length} items
                                </span>
                            </div>
                        </div>

                        {recommendations.length === 0 && !isGenerating && (
                            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground opacity-30 gap-4">
                                <div className="w-24 h-24 rounded-full border-4 border-dashed border-current flex items-center justify-center">
                                    <Sparkles className="w-10 h-10" />
                                </div>
                                <p className="text-lg">Build your recipe above to get started</p>
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
                                    <AnimeCard
                                        anime={{
                                            id: -anime.mal_id,
                                            malId: anime.mal_id,
                                            title: anime.title_english || anime.title,
                                            imageUrl: anime.images.jpg.large_image_url,
                                            rating: Math.round((anime.score || 0) * 10) / 10,
                                            episodes: anime.episodes || 0,
                                            tags: anime.genres?.map((g: any) => g.name) || [],
                                            createdAt: new Date(),
                                            category: "suggestion",
                                            notes: "",
                                            description: anime.synopsis || null,
                                            type: anime.type,
                                            duration: anime.duration,
                                            releaseYear: anime.year
                                        }}
                                        onClick={() => setSelectedJikanAnime(anime)}
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
