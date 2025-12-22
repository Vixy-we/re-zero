import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Star, BookOpen, X } from "lucide-react";
import { useJikanSearch, type JikanAnime, useCreateAnime } from "@/hooks/use-anime";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { motion, AnimatePresence } from "framer-motion";

export function AddAnimeDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"search" | "form">("search");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [selectedJikan, setSelectedJikan] = useState<JikanAnime | null>(null);

  // Form State
  const [category, setCategory] = useState("plan_to_watch");
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const { data: results, isLoading } = useJikanSearch(debouncedQuery);
  const createMutation = useCreateAnime();

  const handleSelect = (anime: JikanAnime) => {
    setSelectedJikan(anime);
    setTags(anime.genres.map(g => g.name));
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!selectedJikan) return;

    await createMutation.mutateAsync({
      malId: selectedJikan.mal_id,
      title: selectedJikan.title,
      imageUrl: selectedJikan.images.jpg.large_image_url || selectedJikan.images.jpg.image_url,
      description: selectedJikan.synopsis,
      tags: tags,
      category: category as "watched" | "plan_to_watch",
      rating: rating ? parseInt(rating) : null,
      notes: notes || null,
      type: selectedJikan.type,
      episodes: selectedJikan.episodes,
      duration: selectedJikan.duration,
      releaseYear: selectedJikan.year || (selectedJikan.aired?.from ? new Date(selectedJikan.aired.from).getFullYear() : null),
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTimeout(() => {
      setStep("search");
      setQuery("");
      setSelectedJikan(null);
      setCategory("plan_to_watch");
      setRating("");
      setNotes("");
      setTags([]);
      setTagInput("");
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto rounded-full shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-purple-500 hover:scale-105 transition-transform font-bold tracking-wide">
          <Plus className="mr-2 h-5 w-5" /> ADD ANIME
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden p-0 gap-0 bg-zinc-950/95 backdrop-blur-xl border-white/10 text-white">
        <div className="flex h-full max-h-[90vh] flex-col">
          {step === "search" ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-white/10 bg-white/5">
                <h2 className="font-display text-2xl font-bold mb-1">Add to Library</h2>
                <div className="relative mt-4">
                  <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by title..."
                    className="pl-12 h-12 rounded-xl bg-black/20 border-white/10 focus:ring-primary/50 text-lg placeholder:text-muted-foreground/50"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
                    <p>Searching the archives...</p>
                  </div>
                ) : query.length >= 3 && results?.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    No anime found matching "{query}"
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results?.map((anime) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={anime.mal_id}
                        onClick={() => handleSelect(anime)}
                        className="flex gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all border border-transparent hover:border-primary/30 group"
                      >
                        <div className="w-16 h-24 shrink-0 overflow-hidden rounded-md shadow-lg">
                          <img
                            src={anime.images.jpg.image_url}
                            alt={anime.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors truncate">{anime.title}</h3>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="text-[10px] uppercase tracking-wider bg-black/40 px-1.5 py-0.5 rounded text-muted-foreground">{anime.year || "N/A"}</span>
                            <span className="text-[10px] uppercase tracking-wider bg-black/40 px-1.5 py-0.5 rounded text-muted-foreground">{anime.type}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                {!query && !isLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 pb-20">
                    <Search className="w-16 h-16 mb-4" />
                    <p>Type to search for an anime</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row h-full overflow-hidden animate-in fade-in slide-in-from-right-10 duration-300">
              {/* Left Side: Poster and Quick Info */}
              <div className="w-full md:w-[280px] bg-black/30 p-6 flex flex-col items-center border-r border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50 pointer-events-none" />

                <div className="w-48 aspect-[2/3] rounded-lg shadow-2xl border-4 border-white/5 overflow-hidden relative z-10 mb-6">
                  <img
                    src={selectedJikan?.images.jpg.large_image_url}
                    alt={selectedJikan?.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-center relative z-10 w-full mb-auto">
                  <h2 className="font-display text-xl font-bold leading-tight mb-2 line-clamp-2">{selectedJikan?.title}</h2>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {selectedJikan?.genres.slice(0, 3).map(g => (
                      <span key={g.name} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full border border-white/5">
                        {g.name}
                      </span>
                    ))}
                  </div>
                </div>

                <Button variant="ghost" className="w-full mt-6 text-muted-foreground hover:text-white relative z-20" onClick={() => {
                  setStep("search");
                  setSelectedJikan(null);
                }}>
                  ← Back to Search
                </Button>
              </div>

              {/* Right Side: Form */}
              <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-gradient-to-br from-zinc-900 to-black">
                <h3 className="text-lg font-bold border-b border-white/10 pb-4 mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Review & Shelf
                </h3>

                <div className="space-y-6">
                  {/* Synopsis Section */}
                  {selectedJikan?.synopsis && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Synopsis</Label>
                      <p className="text-sm text-gray-300 leading-relaxed max-h-[200px] overflow-y-auto pr-2 custom-scrollbar bg-white/5 p-3 rounded-lg border border-white/5">
                        {selectedJikan.synopsis}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Shelf</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plan_to_watch">Plan to Watch</SelectItem>
                          <SelectItem value="watched">Watched</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Rating (1-10)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          placeholder="-"
                          className="bg-white/5 border-white/10 h-11 pl-10"
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                        />
                        <Star className="w-4 h-4 text-yellow-500 absolute left-3 top-3.5" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tags</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map((tag) => (
                          <div key={tag} className="bg-secondary/50 px-2 py-1 rounded text-xs border border-white/5 flex items-center gap-1 group">
                            <span>{tag}</span>
                            <button
                              onClick={() => setTags(tags.filter(t => t !== tag))}
                              className="text-muted-foreground hover:text-red-400 opacity-50 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="Add a tag + Enter"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                                setTags([...tags, tagInput.trim()]);
                                setTagInput("");
                              }
                            }
                          }}
                          className="bg-white/5 border-white/10 h-9 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Personal Notes</Label>
                      <Textarea
                        placeholder="What did you think about this show? (Optional)"
                        className="bg-white/5 border-white/10 min-h-[80px] resize-none focus:ring-primary/50"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-8">
                    <Button
                      onClick={handleSubmit}
                      disabled={createMutation.isPending}
                      className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl"
                    >
                      {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Add to Library"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
