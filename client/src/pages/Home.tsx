import { useState } from "react";
import { useAnimeList, useJikanSearch, useJikanExplore, useCreateAnime, type JikanAnime } from "@/hooks/use-anime";
import { AddAnimeDialog } from "@/components/AddAnimeDialog";
import { AnimeCard } from "@/components/AnimeCard";
import { AnimeDetailsDialog } from "@/components/AnimeDetailsDialog";
import { Link } from "wouter";

import { GlobalAnimeGrid } from "@/components/GlobalAnimeGrid";
import { RefreshLibraryDialog } from "@/components/RefreshLibraryDialog";
import { LibraryAnalytics } from "@/components/LibraryAnalytics";
import { useDebounce } from "@/hooks/use-debounce";
import type { Anime } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Loader2, LayoutGrid, List, Database, Search, FilterX, Filter, Check, ChevronDown, ChevronUp, Sparkles, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Home() {
  const { data: animeList, isLoading } = useAnimeList();
  const createAnime = useCreateAnime();
  const [recentlyAdded, setRecentlyAdded] = useState<number[]>([]);

  const handleQuickAdd = async (anime: JikanAnime) => {
    // Visual feedback immediately
    if (!recentlyAdded.includes(anime.mal_id)) {
      setRecentlyAdded(prev => [...prev, anime.mal_id]);
    }

    try {
      await createAnime.mutateAsync({
        malId: anime.mal_id,
        title: anime.title_english || anime.title,
        imageUrl: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
        rating: 0,
        category: "plan_to_watch",
        tags: anime.genres?.map(g => g.name) || [],
        notes: "",
        type: anime.type,
        episodes: anime.episodes,
        duration: anime.duration,
        releaseYear: anime.year
      });

      // Remove after delay to allow visual "Tick" to be seen (delayed disappear)
      setTimeout(() => {
        setRecentlyAdded(prev => prev.filter(id => id !== anime.mal_id));
      }, 1000);
    } catch (e) {
      setRecentlyAdded(prev => prev.filter(id => id !== anime.mal_id));
    }
  };

  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("watched");
  const [sortBy, setSortBy] = useState<"title" | "rating" | "newest">("newest");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tempFilterTags, setTempFilterTags] = useState<string[]>([]);
  const [excludeTags, setExcludeTags] = useState<string[]>([]);
  const [tempExcludeInput, setTempExcludeInput] = useState("");
  const [isExcludeOpen, setIsExcludeOpen] = useState(false);

  // Global DB & Explore States
  const [globalType, setGlobalType] = useState<string | null>("all");
  const [globalQuery, setGlobalQuery] = useState("");
  const globalDebouncedQuery = useDebounce(globalQuery, 500);
  const { data: globalAnime, isLoading: isGlobalLoading } = useJikanSearch(globalDebouncedQuery, globalType);

  const [exploreType, setExploreType] = useState<string | null>("all");
  const [exploreFilter, setExploreFilter] = useState<string | null>("bypopularity");

  const [exploreInclude, setExploreInclude] = useState("");
  const [exploreExclude, setExploreExclude] = useState("");
  const debouncedInclude = useDebounce(exploreInclude, 600);
  const debouncedExclude = useDebounce(exploreExclude, 600);

  const {
    data: exploreData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isExploreLoading
  } = useJikanExplore(exploreType, exploreFilter, debouncedInclude, debouncedExclude);

  // Create a Set of existing MAL IDs to check status
  const libraryMalIds = new Set(animeList?.map(a => a.malId).filter(Boolean));
  const displayLibraryIds = new Set([...Array.from(libraryMalIds), ...recentlyAdded]);

  // Filter out anime that are already in the library, unless recently added (to show tick animation)
  const exploreAnime = (exploreData?.pages.flatMap(page => page.data) || []).filter(
    a => !libraryMalIds.has(a.mal_id) || recentlyAdded.includes(a.mal_id)
  );

  const [selectedJikanAnime, setSelectedJikanAnime] = useState<JikanAnime | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Calculate counts (deduplicated)
  const uniqueList = animeList ? Array.from(new Map(animeList.map(item => [item.malId, item])).values()) : [];
  const watchedCount = uniqueList.filter(a => a.category === 'watched').length;
  const planCount = uniqueList.filter(a => a.category === 'plan_to_watch').length;

  const tabs = [
    { id: "watched", label: "Watched", count: watchedCount },
    { id: "plan_to_watch", label: "Plan to Watch", count: planCount },
    { id: "explore", label: "Explore" },
    { id: "global", label: "Global DB" },
  ];

  // Filter and Sort Logic
  const getFilteredList = (category: string) => {
    if (!animeList) return [];

    // Prioritize deduplication: Create Map by MalId to ensure uniqueness
    const uniqueList = Array.from(new Map(animeList.map(item => [item.malId, item])).values());

    let filtered = uniqueList.filter(a => a.category === category);

    if (search) {
      filtered = filtered.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
    }

    if (filterTags.length > 0) {
      filtered = filtered.filter(a =>
        filterTags.every(tag => a.tags?.includes(tag))
      );
    }

    if (excludeTags.length > 0) {
      filtered = filtered.filter(a =>
        !excludeTags.some(tag => a.tags?.includes(tag))
      );
    }

    return filtered.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      // Newest (by creation date, descending)
      return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
    });
  };

  // Extract all unique tags for filtering
  const allTags = Array.from(new Set(animeList?.flatMap(a => a.tags || []) || [])).sort();

  if (isLoading && !animeList) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">

      {/* Hero Header */}
      <div className="relative h-[200px] md:h-[280px] bg-gradient-to-r from-background via-purple-900/10 to-background border-b border-white/5 overflow-hidden flex flex-col">
        {/* Abstract Background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary via-background to-background" />

        {/* Top Controls Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-50 flex items-center justify-between pt-6 container mx-auto px-6"
        >
          <div className="flex gap-4 items-center">
            <RefreshLibraryDialog animeList={animeList || []} />
            <LibraryAnalytics animeList={animeList || []} />
            <Link href="/suggestions">
              <Button variant="outline" className="gap-2 border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all group">
                <Sparkles className="w-4 h-4 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
                <span className="hidden sm:inline">Suggestions</span>
              </Button>
            </Link>
            <Link href="/smart-suggestions">
              <Button variant="outline" className="gap-2 border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all group">
                <BrainCircuit className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
                <span className="hidden sm:inline">Smart Engine</span>
              </Button>
            </Link>
          </div>

          <Link href="/infinite-shelf">
            <Button variant="ghost" className="text-white bg-black/40 hover:bg-black/60 hover:text-white text-xs font-mono uppercase tracking-widest flex items-center gap-2 transition-all border border-white/20 hover:border-white/40 px-4 py-2 rounded-full backdrop-blur-md shadow-xl group">
              <span className="hidden sm:inline">Infinite SHELF</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Button>
          </Link>
        </motion.div>

        <div className="container mx-auto px-6 flex-1 flex flex-col justify-center relative z-10 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold mb-2 tracking-tight">
              My <span className="text-primary">Anime</span> Shelf
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg">
              Track your journey through worlds unknown. Organize your watched series and plan your next adventure.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-8 relative z-20">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Controls Bar */}
          <div className="glass-panel rounded-2xl p-4 mb-8 flex flex-col lg:flex-row gap-6 justify-between items-center">
            {/* Wrapped Tabs Container */}
            <div className="w-full lg:w-auto">
              <TabsList className="bg-secondary/50 p-1 border border-white/5 relative rounded-3xl inline-flex flex-wrap w-full h-auto justify-center gap-1">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="relative px-4 sm:px-6 py-2 z-10 data-[state=active]:bg-transparent data-[state=active]:text-white transition-colors hover:text-white/80 rounded-full flex-1 lg:flex-none text-sm sm:text-base"
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="active-tab"
                        className="absolute inset-0 bg-primary rounded-full -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}

                    <span className="relative z-10 flex items-center">
                      {tab.label}
                      {(tab as any).count !== undefined && (tab as any).count > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-2 bg-white/15 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                        >
                          {(tab as any).count}
                        </motion.span>
                      )}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch">
              <Input
                placeholder="Filter titles..."
                className="bg-secondary/50 border-white/10 w-full md:w-[200px] rounded-full px-4"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <Button
                variant="outline"
                className={`bg-secondary/50 border-white/10 rounded-full px-4 ${filterTags.length > 0 ? 'text-primary border-primary/50 bg-primary/10' : ''}`}
                onClick={() => {
                  setTempFilterTags(filterTags);
                  setIsFilterOpen(true);
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter {filterTags.length > 0 && `(${filterTags.length})`}
              </Button>

              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-full sm:w-[140px] bg-secondary/50 border-white/10 rounded-full px-4">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest Added</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="rating">Rating (High-Low)</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-full sm:w-auto">
                <AddAnimeDialog
                  isOpen={isAddDialogOpen}
                  onOpenChange={setIsAddDialogOpen}
                />
              </div>
            </div>
          </div>



          {/* Active Filters Display */}
          {/* Active Filters Display */}
          {(filterTags.length > 0 || excludeTags.length > 0) && activeTab !== "global" && (
            <div className="flex flex-wrap gap-2 mb-6 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => { setFilterTags([]); setExcludeTags([]); }}
                className="px-3 py-1 rounded-full text-xs font-medium border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors whitespace-nowrap flex items-center gap-1 group"
              >
                <FilterX className="w-3 h-3 group-hover:scale-110 transition-transform" /> Clear
              </button>
              {filterTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTags(prev => prev.filter(t => t !== tag))}
                  className="px-3 py-1 rounded-full text-xs font-bold border border-primary bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/80 transition-all flex items-center group"
                >
                  {tag}
                </button>
              ))}
              {excludeTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setExcludeTags(prev => prev.filter(t => t !== tag))}
                  className="px-3 py-1 rounded-full text-xs font-bold border border-red-500 bg-red-500 text-white shadow-md shadow-red-500/20 hover:bg-red-600 transition-all flex items-center group"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          <TabsContent value="watched" className="mt-0">
            <AnimeGrid
              items={getFilteredList('watched')}
              onSelect={setSelectedAnime}
              emptyMessage="You haven't finished any anime yet."
            />
          </TabsContent>

          <TabsContent value="plan_to_watch" className="mt-0">
            <AnimeGrid
              items={getFilteredList('plan_to_watch')}
              onSelect={setSelectedAnime}
              emptyMessage="Your plan to watch list is empty."
            />
          </TabsContent>

          <TabsContent value="explore" className="mt-0 space-y-6">
            <div className="flex flex-col items-center gap-4 mb-8">
              <Tabs value={exploreFilter || "bypopularity"} onValueChange={(v) => setExploreFilter(v)} className="w-auto">
                <TabsList className="bg-white/5 p-1 border border-white/10 rounded-full h-auto flex flex-wrap justify-center gap-1 mb-2">
                  {[
                    { id: "bypopularity", label: "Most Popular" },
                    { id: "top_rated", label: "Top Rated" },
                    { id: "airing", label: "Airing Now" },
                    { id: "just_released", label: "Just Released" },
                    { id: "upcoming", label: "Upcoming" }
                  ].map(option => (
                    <TabsTrigger
                      key={option.id}
                      value={option.id}
                      className="relative px-4 py-1.5 rounded-full text-xs font-bold transition-colors data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=inactive]:text-muted-foreground hover:text-white z-10"
                    >
                      {exploreFilter === option.id && (
                        <motion.div
                          layoutId="active-explore-filter"
                          className="absolute inset-0 bg-primary rounded-full -z-10 shadow-md shadow-primary/20"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="flex flex-wrap justify-center gap-2">
                {["all", "tv", "movie", "ova", "special", "ona", "music"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setExploreType(type)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all uppercase tracking-wide ${exploreType === type
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/25 scale-105"
                      : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="w-full max-w-2xl px-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 animate-in fade-in slide-in-from-top-1">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Include Tags</label>
                  </div>
                  <Input
                    placeholder="e.g. Action, Fantasy"
                    value={exploreInclude}
                    onChange={e => setExploreInclude(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl h-9 text-xs focus:ring-1 focus:ring-green-500/50 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Exclude Tags</label>
                  </div>
                  <Input
                    placeholder="e.g. Mecha, Horror"
                    value={exploreExclude}
                    onChange={e => setExploreExclude(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl h-9 text-xs focus:ring-1 focus:ring-red-500/50 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <GlobalAnimeGrid
              key={`${exploreFilter}-${debouncedInclude}-${debouncedExclude}`}
              items={exploreAnime}
              isLoading={isExploreLoading}
              libraryIds={displayLibraryIds}
              onQuickAdd={handleQuickAdd}
              onSelect={setSelectedJikanAnime}
            />

            {hasNextPage && (
              <div className="flex justify-center pt-8 pb-12">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white min-w-[200px]"
                >
                  {isFetchingNextPage ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="global" className="mt-0 space-y-6">
            <div className="flex flex-col gap-4 mb-6">
              <div className="relative flex-1 max-w-lg mx-auto w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search Global Database (e.g. Naruto, One Piece)..."
                  value={globalQuery}
                  onChange={(e) => setGlobalQuery(e.target.value)}
                  className="pl-10 h-11 bg-white/5 border-white/10 rounded-xl"
                />
                {isGlobalLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {["all", "tv", "movie", "ova", "special", "ona", "music"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setGlobalType(type)}
                    className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border transition-all uppercase tracking-wide ${globalType === type
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                      : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <GlobalAnimeGrid
              items={globalAnime || []}
              isLoading={isGlobalLoading}
              libraryIds={displayLibraryIds}
              onQuickAdd={handleQuickAdd}
              onSelect={setSelectedJikanAnime}
            />
          </TabsContent>
        </Tabs >

      </div >

      <AnimeDetailsDialog
        anime={selectedAnime}
        onClose={() => setSelectedAnime(null)}
      />

      {/* Context Dialog for Explore/Global Card Clicks */}
      <AddAnimeDialog
        isOpen={!!selectedJikanAnime}
        onOpenChange={(v) => !v && setSelectedJikanAnime(null)}
        initialAnime={selectedJikanAnime}
        trigger={<span className="hidden" />}
      />
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-lg bg-zinc-950/95 border-white/10 text-white gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-white/10">
            <DialogTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" /> Filter by Tags
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Include</label>
              <ScrollArea className="h-[200px] pr-4 border rounded-md border-white/5 bg-black/20 p-2">
                <div className="grid grid-cols-2 gap-2">
                  {allTags.map((tag) => {
                    const isSelected = tempFilterTags.includes(tag);
                    return (
                      <div
                        key={tag}
                        onClick={() => {
                          if (isSelected) {
                            setTempFilterTags(prev => prev.filter(t => t !== tag));
                          } else {
                            setTempFilterTags(prev => [...prev, tag]);
                          }
                        }}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm cursor-pointer transition-all ${isSelected
                          ? "bg-primary/20 border-primary/50 text-white"
                          : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10"
                          }`}
                      >
                        <span>{tag}</span>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setIsExcludeOpen(!isExcludeOpen)}
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider hover:text-white transition-colors"
              >
                Exclude {isExcludeOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isExcludeOpen && (
                <div className="animate-in slide-in-from-top-2">
                  <Input
                    placeholder="e.g. Horror, Mecha (comma separated)"
                    value={tempExcludeInput}
                    onChange={(e) => setTempExcludeInput(e.target.value)}
                    className="bg-black/20 border-white/10 text-white placeholder:text-muted-foreground/50"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter tags separated by commas.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 sm:justify-between items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setTempFilterTags([]);
                setTempExcludeInput("");
              }}
              className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
            >
              <FilterX className="w-4 h-4 mr-2" /> Clear Filters
            </Button>
            <Button
              onClick={() => {
                setFilterTags(tempFilterTags);
                const newExcludes = tempExcludeInput
                  .split(",")
                  .map(s => s.trim())
                  .filter(s => s.length > 0);
                setExcludeTags(newExcludes);
                setIsFilterOpen(false);
              }}
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
            >
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function AnimeGrid({ items, onSelect, emptyMessage }: { items: Anime[], onSelect: (a: Anime) => void, emptyMessage: string }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <List className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 md:gap-8">
      <AnimatePresence>
        {items.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} onClick={onSelect} />
        ))}
      </AnimatePresence>
    </div>
  );
}
