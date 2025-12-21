import { useState } from "react";
import { useAnimeList } from "@/hooks/use-anime";
import { AddAnimeDialog } from "@/components/AddAnimeDialog";
import { AnimeCard } from "@/components/AnimeCard";
import { AnimeDetailsDialog } from "@/components/AnimeDetailsDialog";
import type { Anime } from "@shared/schema";
import { Loader2, LayoutGrid, List, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const { data: animeList, isLoading } = useAnimeList();
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("watched");
  const [sortBy, setSortBy] = useState<"title" | "rating" | "newest">("newest");
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const tabs = [
    { id: "watched", label: "Watched" },
    { id: "plan_to_watch", label: "Plan to Watch" },
    { id: "global", label: "Global DB" },
  ];

  // Filter and Sort Logic
  const getFilteredList = (category: string) => {
    if (!animeList) return [];

    let filtered = animeList.filter(a => a.category === category);

    if (search) {
      filtered = filtered.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
    }

    if (filterTag) {
      filtered = filtered.filter(a => a.tags?.includes(filterTag));
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">

      {/* Hero Header */}
      <div className="relative h-[200px] md:h-[280px] bg-gradient-to-r from-background via-purple-900/10 to-background border-b border-white/5 overflow-hidden">
        {/* Abstract Background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary via-background to-background" />

        <div className="container mx-auto px-6 h-full flex flex-col justify-center relative z-10">
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
            {/* Scrollable Tabs Container */}
            <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
              <TabsList className="bg-secondary/50 p-1 border border-white/5 relative rounded-full inline-flex min-w-full lg:min-w-fit justify-start lg:justify-center">
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
                    {tab.label}
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
                <AddAnimeDialog />
              </div>
            </div>
          </div>

          {/* Tags Bar */}
          {allTags.length > 0 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
              <button
                onClick={() => setFilterTag(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${filterTag === null ? "bg-primary text-white border-primary" : "bg-transparent border-white/10 hover:border-white/30 text-muted-foreground"
                  }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${filterTag === tag ? "bg-primary text-white border-primary" : "bg-transparent border-white/10 hover:border-white/30 text-muted-foreground"
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Grid Content */}
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

          <TabsContent value="global" className="mt-0">
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
              <Database className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-display text-2xl font-bold mb-2">Global Database</h3>
              <p className="text-muted-foreground max-w-md">
                We're building a massive database of all anime ever created.
                Coming soon to your shelf!
              </p>
            </div>
          </TabsContent>
        </Tabs>

      </div>

      <AnimeDetailsDialog
        anime={selectedAnime}
        onClose={() => setSelectedAnime(null)}
      />
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
