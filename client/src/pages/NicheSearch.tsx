import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
    ArrowLeft, Search, Sparkles, Filter,
    Database, BrainCircuit, Loader2, Star,
    Users, Calendar, Info, Compass, Tag, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "@/hooks/use-debounce";
import * as Accordion from "@radix-ui/react-accordion";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AddAnimeDialog } from "@/components/AddAnimeDialog";
import { type JikanAnime } from "@/hooks/use-anime";
import { Plus } from "lucide-react";

// --- Types ---
interface AniListMedia {
    id: number;
    idMal: number | null;
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
    favourites: number;
    siteUrl: string;
    format: string;
    genres: string[];
    tags: { name: string; rank: number; category: string }[];
    episodes: number;
    seasonYear: number;
    nicheScore?: number;
    curatorReason?: string;
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
      idMal
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
      favourites
      siteUrl
      format
      genres
      tags {
        name
        rank
        category
      }
      episodes
      seasonYear
    }
  }
}
`;

const NICHE_TAGS_CATEGORIES = {
    "Atmosphere & Pacing": [
        "Iyashikei", "Slow Burn", "Atmospheric", "Quiet", "Surreal",
        "Melancholy", "Dreamlike", "Liminality"
    ],
    "Tone & Emotion": [
        "Bittersweet", "Tragedy", "Heartwarming", "Dark", "Wholesome",
        "Cynical", "Philosophical", "Introspective"
    ],
    "Narrative Style": [
        "Episodic", "Non-linear", "Ensemble Cast", "Character Driven",
        "Mystery", "Thriller", "Avant Garde"
    ],
    "Themes": [
        "Cyberpunk", "Steampunk", "Post-Apocalyptic", "Space", "Military",
        "Historical", "Samurai", "Martial Arts", "Demons", "Vampires",
        "Zombie", "Ghost", "Seinen", "Josei", "Time Manipulation",
        "Isekai", "Mafia", "Parody"
    ]
};

export default function NicheSearch() {
    const [search, setSearch] = useState("");
    const [popularityCeiling, setPopularityCeiling] = useState(50000); // What defines "Niche"
    const [minScore, setMinScore] = useState(70);
    const [results, setResults] = useState<AniListMedia[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAnime, setSelectedAnime] = useState<AniListMedia | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // Convert AniList data to Jikan structure for the Add Dialog
    const mapAniListToJikan = (anime: AniListMedia): JikanAnime => {
        return {
            mal_id: anime.idMal || 0, // Fallback if no MAL ID (might block adding, handled in dialog)
            title: anime.title.english || anime.title.romaji,
            title_english: anime.title.english,
            images: {
                jpg: {
                    image_url: anime.coverImage.extraLarge,
                    large_image_url: anime.coverImage.extraLarge,
                }
            },
            type: anime.format,
            episodes: anime.episodes,
            duration: "",
            score: anime.averageScore / 10,
            year: anime.seasonYear,
            synopsis: anime.description,
            genres: anime.genres.map(g => ({ name: g })),
            aired: { from: anime.seasonYear ? `${anime.seasonYear}-01-01` : "" }
        } as JikanAnime;
    };

    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

    // Flatten categories into a single selected tags array for the query
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);

    const nichePresets = [
        { id: "mainstream", label: "Mainstream", cap: 200000, score: 65, color: "zinc" },
        { id: "underground", label: "Underground", cap: 60000, score: 70, color: "blue" },
        { id: "cult", label: "Cult Classic", cap: 15000, score: 75, color: "purple" },
        { id: "deep", label: "Deep Niche", cap: 3000, score: 60, color: "emerald" },
    ];

    const formatOptions = [
        { id: "TV", label: "TV Series" },
        { id: "MOVIE", label: "Movie" },
        { id: "OVA", label: "OVA" },
        { id: "ONA", label: "ONA" },
        { id: "TV_SHORT", label: "Shorts" },
        { id: "SPECIAL", label: "Special" }
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

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const toggleFormat = (format: string) => {
        setSelectedFormats(prev =>
            prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
        );
    };

    const calculateNicheScore = (anime: AniListMedia, tags: string[]) => {
        let score = 0;

        // 1. Tag Relevance (Heavy Weight)
        // We check meaningful overlap with selected tags
        const animeTags = anime.tags.map(t => t.name);
        // Only count matches from the manually selected tags to avoid double counting genre overlap if unused
        const matches = tags.length > 0 ? tags.filter(tag => animeTags.includes(tag)) : [];
        if (matches.length > 0) score += matches.length * 15;

        // 2. Cultural Saturation Penalty (The "Niche" factor)
        const popPenalty = Math.log10(anime.popularity + 1) * 20;
        score -= popPenalty;

        // 3. Quiet Engagement Reward (Cult Factor)
        const engagementRatio = (anime.favourites / (anime.popularity + 1)) * 100;
        score += engagementRatio * 2;

        // 4. Quality Floor Bonus
        if (anime.averageScore > 80) score += 10;
        if (anime.averageScore > 75) score += 5;

        // 5. Format Bonus (Movies/OVAs often more niche)
        if (anime.format === "MOVIE" || anime.format === "OVA") score += 5;

        return { score, matches };
    };

    const generateCuratorReason = (anime: AniListMedia, matches: string[]) => {
        const parts = [];
        if (matches.length > 0) parts.push(`Matches ${matches.slice(0, 2).join(" & ")}`);

        const engagement = ((anime.favourites / anime.popularity) * 100).toFixed(1);
        if (Number(engagement) > 10) parts.push(`high cult engagement (${engagement}%)`);
        else if (anime.popularity < 5000) parts.push("extremely obscure find");
        else if (anime.averageScore > 80) parts.push("critically acclaimed hidden gem");

        return parts.join(" • ") || "Thematically relevant discovery";
    };

    const fetchNicheAnime = async () => {
        setLoading(true);
        try {
            const variables: any = {
                page: 1,
                perPage: 50, // Larger pool for client-side ranking
                popularityLesser: debouncedPopularity,
                scoreGreater: debouncedScore,
            };

            if (debouncedSearch) variables.search = debouncedSearch;
            if (selectedTags.length > 0) variables.tags = selectedTags;
            if (selectedFormats.length > 0) variables.format = selectedFormats;

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
                let media = json.data.Page.media as AniListMedia[];

                // Apply Curator Scoring
                const rankedMedia = media.map(item => {
                    const { score, matches } = calculateNicheScore(item, selectedTags);
                    return { ...item, nicheScore: score, curatorReason: generateCuratorReason(item, matches) };
                });

                // Sort by our custom Niche Score instead of raw API sort
                rankedMedia.sort((a, b) => b.nicheScore - a.nicheScore);

                // Take top 20 after ranking
                setResults(rankedMedia.slice(0, 20));
            }
        } catch (error) {
            console.error("AniList Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNicheAnime();
    }, [debouncedSearch, debouncedPopularity, debouncedScore, selectedTags, selectedFormats]);

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans">
            <AddAnimeDialog
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                initialAnime={selectedAnime ? mapAniListToJikan(selectedAnime) : null}
                trigger={<span className="hidden" />}
            />

            <Dialog open={!!selectedAnime} onOpenChange={(open) => !open && setSelectedAnime(null)}>
                <DialogContent className="max-w-2xl bg-zinc-950 border-white/10 p-0 overflow-hidden">
                    {selectedAnime && (
                        <div className="grid md:grid-cols-[200px_1fr]">
                            <div className="relative h-64 md:h-full">
                                <img
                                    src={selectedAnime.coverImage.extraLarge}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent md:hidden" />
                            </div>
                            <div className="p-6 flex flex-col h-full max-h-[80vh] overflow-y-auto">
                                <div className="mb-4">
                                    <h2 className="text-2xl font-bold font-display leading-tight mb-1">
                                        {selectedAnime.title.english || selectedAnime.title.romaji}
                                    </h2>
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground items-center">
                                        <Badge variant="outline" className="border-white/10">{selectedAnime.format}</Badge>
                                        <span>{selectedAnime.seasonYear}</span>
                                        <span>•</span>
                                        <span>{selectedAnime.episodes} eps</span>
                                        <span>•</span>
                                        <span className="text-blue-400 font-bold flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-current" /> {selectedAnime.averageScore}%
                                        </span>
                                    </div>
                                </div>

                                <ScrollArea className="flex-1 pr-4 -mr-4 mb-6">
                                    <div className="space-y-4">
                                        {selectedAnime.curatorReason && (
                                            <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-1">Curator Log</div>
                                                <p className="text-sm text-zinc-300 font-mono italic">{selectedAnime.curatorReason}</p>
                                            </div>
                                        )}

                                        <div>
                                            <h3 className="text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Synopsis</h3>
                                            <p className="text-zinc-300 leading-relaxed text-sm whitespace-pre-wrap">
                                                {selectedAnime.description?.replace(/<[^>]*>?/gm, '') || "No synopsis available."}
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Tags</h3>
                                            <div className="flex flex-wrap gap-1.5">
                                                {selectedAnime.tags.filter(t => t.rank > 60).slice(0, 10).map(tag => (
                                                    <span key={tag.name} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-zinc-400 border border-white/5">
                                                        {tag.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>

                                <div className="mt-auto pt-4 border-t border-white/5 flex gap-3">
                                    <Button
                                        className="flex-1 bg-white text-black hover:bg-zinc-200"
                                        onClick={() => {
                                            setIsAddDialogOpen(true);
                                            // Keep selectedAnime set so we pass it to the dialog
                                        }}
                                        disabled={!selectedAnime.idMal}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        {selectedAnime.idMal ? "Add to Library" : "Not on MAL"}
                                    </Button>
                                    <Button variant="outline" className="border-white/10 hover:bg-white/5" asChild>
                                        <a href={selectedAnime.siteUrl} target="_blank" rel="noopener noreferrer">
                                            AniList Page
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
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
                    <aside className="space-y-8 lg:sticky lg:top-8 lg:h-[calc(100vh-100px)] lg:overflow-y-auto pr-4 pb-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 transition-colors">
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

                            {/* Format / Type Filter */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold uppercase tracking-widest text-orange-400">Format</label>
                                <div className="flex flex-wrap gap-2">
                                    {formatOptions.map(format => (
                                        <Badge
                                            key={format.id}
                                            variant="outline"
                                            className={`cursor-pointer transition-all border-white/5 py-1 px-3 rounded-lg text-[10px] ${selectedFormats.includes(format.id)
                                                ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/25"
                                                : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                                                }`}
                                            onClick={() => toggleFormat(format.id)}
                                        >
                                            {format.label}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Categorized Tags */}
                            <div className="space-y-4 pt-2 border-t border-white/5">
                                <label className="text-sm font-bold uppercase tracking-widest text-purple-400">Curated Tags</label>
                                <Accordion.Root type="multiple" className="space-y-2">
                                    {Object.entries(NICHE_TAGS_CATEGORIES).map(([category, tags]) => (
                                        <Accordion.Item key={category} value={category} className="border border-white/5 rounded-xl bg-white/5 overflow-hidden">
                                            <Accordion.Header>
                                                <Accordion.Trigger className="flex w-full justify-between items-center p-3 text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors text-zinc-300">
                                                    {category}
                                                    <ChevronDown className="w-3 h-3 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180" />
                                                </Accordion.Trigger>
                                            </Accordion.Header>
                                            <Accordion.Content className="p-3 pt-0">
                                                <div className="flex flex-wrap gap-1.5 pt-2">
                                                    {tags.map(tag => (
                                                        <Badge
                                                            key={tag}
                                                            variant="outline"
                                                            className={`cursor-pointer transition-all border-white/5 py-1 px-2 rounded-md text-[9px] ${selectedTags.includes(tag)
                                                                ? "bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/25"
                                                                : "bg-black/20 hover:bg-white/10 text-muted-foreground"
                                                                }`}
                                                            onClick={() => toggleTag(tag)}
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </Accordion.Content>
                                        </Accordion.Item>
                                    ))}
                                </Accordion.Root>
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
                                            onClick={() => setSelectedAnime(anime)}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: (idx % 10) * 0.05 }}
                                            className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-all hover:border-blue-500/30 shadow-xl cursor-pointer"
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

                                                    <div className="text-xs text-muted-foreground line-clamp-3 mb-4 flex-1">
                                                        {anime.curatorReason ? (
                                                            <div className="mb-2 text-purple-400 font-bold tracking-wide text-[10px] uppercase border-l-2 border-purple-500 pl-2">
                                                                {anime.curatorReason}
                                                            </div>
                                                        ) : null}
                                                        <p>
                                                            {anime.description?.replace(/<[^>]*>?/gm, '') || "No transmission log available."}
                                                        </p>
                                                    </div>

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
