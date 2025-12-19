import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2 } from "lucide-react";
import { useJikanSearch, type JikanAnime, useCreateAnime } from "@/hooks/use-anime";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AddAnimeDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"search" | "form">("search");
  const [query, setQuery] = useState("");
  const [selectedJikan, setSelectedJikan] = useState<JikanAnime | null>(null);

  // Form State
  const [category, setCategory] = useState("plan_to_watch");
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");
  
  const { data: results, isLoading } = useJikanSearch(query);
  const createMutation = useCreateAnime();

  const handleSelect = (anime: JikanAnime) => {
    setSelectedJikan(anime);
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!selectedJikan) return;

    await createMutation.mutateAsync({
      malId: selectedJikan.mal_id,
      title: selectedJikan.title,
      imageUrl: selectedJikan.images.jpg.large_image_url || selectedJikan.images.jpg.image_url,
      description: selectedJikan.synopsis,
      tags: selectedJikan.genres.map(g => g.name),
      category: category as "watched" | "plan_to_watch",
      rating: rating ? parseInt(rating) : null,
      notes: notes || null,
    });
    
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setStep("search");
    setQuery("");
    setSelectedJikan(null);
    setCategory("plan_to_watch");
    setRating("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-full shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-purple-500 hover:scale-105 transition-transform">
          <Plus className="mr-2 h-5 w-5" /> Add Anime
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border-white/10 text-card-foreground">
        {step === "search" ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl font-bold">Add to Library</h2>
              <p className="text-muted-foreground">Search for an anime to add to your collection.</p>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search anime title..."
                className="pl-12 h-12 rounded-xl bg-secondary/50 border-white/10 focus:ring-primary/50 text-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="min-h-[300px] max-h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {isLoading && (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              
              {!isLoading && query.length >= 3 && results?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No results found.
                </div>
              )}

              {results?.map((anime) => (
                <div
                  key={anime.mal_id}
                  onClick={() => handleSelect(anime)}
                  className="flex gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10 group"
                >
                  <img
                    src={anime.images.jpg.image_url}
                    alt={anime.title}
                    className="w-16 h-24 object-cover rounded-md shadow-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{anime.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{anime.synopsis}</p>
                    <div className="flex gap-2 mt-2">
                      {anime.genres.slice(0, 3).map((g) => (
                        <span key={g.name} className="text-xs bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                          {g.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[200px_1fr]">
            <div className="space-y-4">
              <img
                src={selectedJikan?.images.jpg.large_image_url}
                alt={selectedJikan?.title}
                className="w-full rounded-lg shadow-xl border border-white/10"
              />
              <Button variant="outline" className="w-full" onClick={() => setStep("search")}>
                Back to Search
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold mb-1">{selectedJikan?.title}</h2>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {selectedJikan?.genres.map(g => (
                    <span key={g.name} className="bg-secondary px-2 py-1 rounded-md">{g.name}</span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Shelf</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-secondary/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plan_to_watch">Plan to Watch</SelectItem>
                      <SelectItem value="watched">Watched</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rating (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Rate..."
                    className="bg-secondary/50 border-white/10"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Personal Notes</Label>
                  <Textarea
                    placeholder="What did you think?"
                    className="bg-secondary/50 border-white/10 min-h-[100px]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save to Library"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
