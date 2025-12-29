import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
    ArrowLeft, Search, Sparkles, Filter,
    Database, BrainCircuit, Loader2, Star,
    Users, Calendar, Info, Compass, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "@/hooks/use-debounce";

// --- Types ---
interface AniListMedia {
    id: number;
    title: {
        english: string;
        romaji: string;
    };
    coverImage: {
        extraLarge: string;
    };
    description: string;
    averageScore: number;
    popularity: number;
    format: string;
    genres: string[];
    tags: { name: string }[];
    episodes: number;
    seasonYear: number;
}

// --- AniList GraphQL Queries ---
const ANILIST_URL = "https://graphql.anilist.co";

const SEARCH_QUERY = `
query ($search: String, $page: Int, $perPage: Int, $popularityLesser: Int, $scoreGreater: Int, $format: [MediaFormat], $genres: [String], $tags: [String]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      perPage
      currentPage
      lastPage
      hasNextPage
    }
    media(
      search: $search, 
      type: ANIME, 
      isAdult: false, 
      popularity_lesser: $popularityLesser, 
      averageScore_greater: $scoreGreater,
      format_in: $format,
      genre_in: $genres,
      tag_in: $tags,
      sort: [SCORE_DESC, POPULARITY_DESC]
    ) {
      id
      title {
        english
        romaji
      }
      coverImage {
        extraLarge
      }
      description
      averageScore
      popularity
      format
      genres
      tags {
        name
      }
      episodes
      seasonYear
    }
  }
}
`;

export default function NicheSearch() {
    const [search, setSearch] = useState("");
    const [popularityCeiling, setPopularityCeiling] = useState(50000); // What defines "Niche"
    const [minScore, setMinScore] = useState(70);
    const [results, setResults] = useState<AniListMedia[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

    const nichePresets = [
        { id: "mainstream", label: "Mainstream", cap: 200000, score: 65, color: "zinc" },
        { id: "underground", label: "Underground", cap: 60000, score: 70, color: "blue" },
        { id: "cult", label: "Cult Classic", cap: 15000, score: 75, color: "purple" },
        { id: "deep", label: "Deep Niche", cap: 3000, score: 60, color: "emerald" },
    ];

    const applyPreset = (preset: typeof nichePresets[0]) => {
        setPopularityCeiling(preset.cap);
        setMinScore(preset.score);
    };

    const getNicheBadge = (score: number, popularity: number) => {
        if (score >= 80 && popularity < 5000) return { label: "Mythic Gem", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
        if (score >= 75 && popularity < 15000) return { label: "Legendary Gem", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
        if (score >= 70 && popularity < 40000) return { label: "Rare Treasure", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
        if (popularity < 1000) return { label: "Untouched Archive", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
        return null;
    };

    const debouncedSearch = useDebounce(search, 500);
    const debouncedPopularity = useDebounce(popularityCeiling, 500);
    const debouncedScore = useDebounce(minScore, 500);

    const genresList = [
        "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy",
        "Horror", "Mahou Shoujo", "Mecha", "Music", "Mystery",
        "Psychological", "Romance", "Sci-Fi", "Slice of Life",
        "Sports", "Supernatural", "Thriller"
    ];

    const nicheThemes = [
        "Cyberpunk", "Steampunk", "Post-Apocalyptic", "Space", "Military",
        "Historical", "Samurai", "Martial Arts", "Demons", "Vampires",
        "Zombie", "Ghost", "Seinen", "Josei", "Time Manipulation",
        "Gore", "Surreal", "Avant Garde", "Noir", "Isekai", "Mafia"
    ];

    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

    const fetchNicheAnime = async () => {
        setLoading(true);
        try {
            const variables: any = {
                page: 1,
                perPage: 20,
                popularityLesser: debouncedPopularity,
                scoreGreater: debouncedScore,
            };

            if (debouncedSearch) variables.search = debouncedSearch;
            if (selectedGenres.length > 0) variables.genres = selectedGenres;
            if (selectedThemes.length > 0) variables.tags = selectedThemes;

            const response = await fetch(ANILIST_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    query: SEARCH_QUERY,
                    variables,
                }),
            });

            const json = await response.json();
            if (json.data && json.data.Page) {
                setResults(json.data.Page.media);
            }
        } catch (error) {
            console.error("AniList Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNicheAnime();
    }, [debouncedSearch, debouncedPopularity, debouncedScore, selectedGenres, selectedThemes]);

    const toggleGenre = (genre: string) => {
        setSelectedGenres(prev =>
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        );
    };

    const toggleTheme = (theme: string) => {
        setSelectedThemes(prev =>
            prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]
        );
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Link href="/">
                            <Button variant="ghost" className="mb-4 group text-muted-foreground hover:text-white pl-0">
                                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                                Back to Library
                            </Button>
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
                            Niche <span className="text-blue-400 italic">Discovery</span>
                        </h1>
                        <p className="text-muted-foreground mt-2 max-w-xl">
                            Powered by <span className="text-white font-medium">AniList Intelligence</span>.
                            Find high-quality gems hidden beneath the mainstream surface.
                        </p>
                    </motion.div>

                    {/* Search Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full md:w-96 relative group"
                    >
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-blue-400" />
                        <Input
                            placeholder="Deep search for obscure titles..."
                            className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 text-lg transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </motion.div>
                </div>

                <div className="grid lg:grid-cols-[300px_1fr] gap-10">
                    {/* Sidebar Filters */}
                    <aside className="space-y-8 h-fit lg:sticky lg:top-8">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-8">

                            {/* Niche Presets */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold uppercase tracking-widest text-zinc-400">Search Intensity</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {nichePresets.map(preset => (
                                        <Button
                                            key={preset.id}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => applyPreset(preset)}
                                            className={`rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-bold h-9 uppercase tracking-wider ${popularityCeiling === preset.cap && minScore === preset.score
                                                ? "border-primary/50 bg-primary/10 text-primary shadow-lg shadow-primary/10"
                                                : ""
                                                }`}
                                        >
                                            {preset.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Popularity Cap - The Niche Slider */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="text-sm font-bold uppercase tracking-widest text-blue-400">Popularity Cap</label>
                                    <span className="text-xs font-mono bg-blue-500/20 px-2 py-0.5 rounded text-blue-300">
                                        Max: {popularityCeiling.toLocaleString()}
                                    </span>
                                </div>
                                <Slider
                                    value={[popularityCeiling]}
                                    onValueChange={(v) => setPopularityCeiling(v[0])}
                                    max={200000}
                                    min={100}
                                    step={100}
                                    className="py-4"
                                />
                                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                    Lower popularity limits search to "True Hidden Gems".
                                </p>
                            </div>

                            {/* Score Floor */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="text-sm font-bold uppercase tracking-widest text-green-400">Min Score</label>
                                    <span className="text-xs font-mono bg-green-500/20 px-2 py-0.5 rounded text-green-300">
                                        {minScore}%
                                    </span>
                                </div>
                                <Slider
                                    value={[minScore]}
                                    onValueChange={(v) => setMinScore(v[0])}
                                    max={100}
                                    min={0}
                                    step={1}
                                    className="py-4 text-green-500"
                                />
                            </div>

                            {/* Genres */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold uppercase tracking-widest text-primary">Core Genres</label>
                                <div className="flex flex-wrap gap-2">
                                    {genresList.map(genre => (
                                        <Badge
                                            key={genre}
                                            variant="outline"
                                            className={`cursor-pointer transition-all border-white/5 py-1 px-3 rounded-lg text-[10px] ${selectedGenres.includes(genre)
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/25"
                                                : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                                                }`}
                                            onClick={() => toggleGenre(genre)}
                                        >
                                            {genre}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Themes & Tags */}
                            <div className="space-y-4 pt-2 border-t border-white/5">
                                <label className="text-sm font-bold uppercase tracking-widest text-blue-400">Niche Themes</label>
                                <ScrollArea className="h-[200px] pr-4">
                                    <div className="flex flex-wrap gap-2">
                                        {nicheThemes.map(theme => (
                                            <Badge
                                                key={theme}
                                                variant="outline"
                                                className={`cursor-pointer transition-all border-white/5 py-1 px-3 rounded-lg text-[10px] ${selectedThemes.includes(theme)
                                                    ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/25"
                                                    : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                                                    }`}
                                                onClick={() => toggleTheme(theme)}
                                            >
                                                {theme}
                                            </Badge>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                        </div>

                        {/* Hint Box */}
                        <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/5 text-[11px] text-muted-foreground flex gap-3">
                            <Info className="w-4 h-4 text-blue-400 shrink-0" />
                            <p>
                                AniList scores are community-driven but less prone to "Rating Bombs" compared to MAL. Combined with the Popularity Cap, you can find legendary shows that are often missed.
                            </p>
                        </div>
                    </aside>

                    {/* Results Area */}
                    <main>
                        {loading ? (
                            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground animate-in fade-in">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-4" />
                                <p className="font-mono tracking-widest text-xs">QUERYING ANILIST CLUSTER...</p>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10">
                                <Compass className="w-12 h-12 text-zinc-700 mb-4" />
                                <p className="text-muted-foreground">No matches found for this specific niche configuration.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {results.map((anime, idx) => (
                                        <motion.div
                                            key={anime.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: (idx % 10) * 0.05 }}
                                            className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-all hover:border-blue-500/30 shadow-xl"
                                        >
                                            <div className="grid grid-cols-[140px_1fr] h-full sm:h-[220px]">
                                                {/* Cover */}
                                                <div className="relative overflow-hidden group">
                                                    <img
                                                        src={anime.coverImage.extraLarge}
                                                        alt={anime.title.english || anime.title.romaji}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                        <Badge className="bg-blue-500/80 backdrop-blur-md border-0 text-[10px] font-bold">
                                                            {anime.format}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div className="p-4 flex flex-col h-full bg-gradient-to-r from-zinc-950/20 to-transparent">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5 text-blue-400">
                                                                <Star className="w-4 h-4 fill-current" />
                                                                <span className="font-mono font-bold">{anime.averageScore}%</span>
                                                            </div>
                                                            {/* Dynamic Niche Badge */}
                                                            {getNicheBadge(anime.averageScore, anime.popularity) && (
                                                                <div className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border inline-block whitespace-nowrap ${getNicheBadge(anime.averageScore, anime.popularity)?.color}`}>
                                                                    {getNicheBadge(anime.averageScore, anime.popularity)?.label}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <Users className="w-3 h-3" />
                                                            <span className="text-[10px] font-mono">{anime.popularity.toLocaleString()}</span>
                                                        </div>
                                                    </div>

                                                    <h3 className="font-bold text-base sm:text-lg mb-1 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
                                                        {anime.title.english || anime.title.romaji}
                                                    </h3>

                                                    <div className="flex gap-2 mb-3">
                                                        <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {anime.seasonYear || 'N/A'}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-zinc-500">
                                                            {anime.episodes || '?'} episodes
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-muted-foreground line-clamp-3 mb-4 flex-1">
                                                        {anime.description?.replace(/<[^>]*>?/gm, '') || "No transmission log available."}
                                                    </p>

                                                    <div className="flex flex-wrap gap-1 mt-auto">
                                                        {anime.genres.slice(0, 3).map(g => (
                                                            <span key={g} className="text-[9px] px-2 py-0.5 bg-white/5 border border-white/5 rounded-full text-zinc-400">
                                                                {g}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
