import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateAnime, useDeleteAnime } from "@/hooks/use-anime";
import type { Anime } from "@shared/schema";
import { Star, Trash2, X, Edit2, Save, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";

interface AnimeDetailsDialogProps {
  anime: Anime | null;
  onClose: () => void;
}

export function AnimeDetailsDialog({ anime, onClose }: AnimeDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("");

  const updateMutation = useUpdateAnime();
  const deleteMutation = useDeleteAnime();

  useEffect(() => {
    if (anime) {
      setRating(anime.rating?.toString() || "");
      setNotes(anime.notes || "");
      setCategory(anime.category);
      setIsEditing(false);
    }
  }, [anime]);

  const handleSave = async () => {
    if (!anime) return;
    await updateMutation.mutateAsync({
      id: anime.id,
      rating: rating ? parseInt(rating) : null,
      notes: notes || null,
      category: category as "watched" | "plan_to_watch",
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!anime) return;
    if (confirm("Are you sure you want to delete this anime?")) {
      await deleteMutation.mutateAsync(anime.id);
      onClose();
    }
  };

  if (!anime) return null;

  return (
    <Dialog open={!!anime} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-white/10 text-card-foreground gap-0">
        
        {/* Header Image Area */}
        <div className="relative h-64 w-full">
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent z-10" />
          <img 
            src={anime.imageUrl} 
            alt={anime.title} 
            className="w-full h-full object-cover opacity-50 blur-sm"
          />
          <div className="absolute top-4 right-4 z-20">
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full bg-black/20 hover:bg-black/40 text-white">
                <X className="w-5 h-5" />
              </Button>
            </DialogClose>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid md:grid-cols-[300px_1fr] gap-8 p-8 -mt-32 relative z-20">
          
          {/* Left Column: Poster & Actions */}
          <div className="space-y-6">
            <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border-4 border-card bg-card">
              <img 
                src={anime.imageUrl} 
                alt={anime.title} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="space-y-2">
              {!isEditing ? (
                <>
                  <Button 
                    className="w-full bg-secondary hover:bg-secondary/80 text-white" 
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90" 
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="space-y-6 pt-8 md:pt-0">
            <div>
              <h2 className="font-display text-4xl font-bold mb-2">{anime.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Added {anime.createdAt ? format(new Date(anime.createdAt), 'MMM d, yyyy') : 'Unknown'}
                </span>
                <div className="flex gap-2">
                  {anime.tags?.map(tag => (
                    <span key={tag} className="bg-secondary/50 px-2 py-0.5 rounded text-xs border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {/* Rating & Status */}
              <div className="flex gap-6 items-center bg-secondary/20 p-4 rounded-xl border border-white/5">
                <div className="flex-1">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Rating</Label>
                  {isEditing ? (
                    <Input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={rating} 
                      onChange={e => setRating(e.target.value)}
                      className="w-24 bg-card border-white/10"
                    />
                  ) : (
                    <div className="flex items-center gap-1 text-2xl font-bold text-accent">
                      <Star className="w-6 h-6 fill-current" />
                      <span>{anime.rating || "--"}</span>
                      <span className="text-sm text-muted-foreground font-normal mt-2">/ 10</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 border-l border-white/10 pl-6">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Status</Label>
                  {isEditing ? (
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-[180px] bg-card border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plan_to_watch">Plan to Watch</SelectItem>
                        <SelectItem value="watched">Watched</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      anime.category === 'watched' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {anime.category === 'watched' ? 'Watched' : 'Plan to Watch'}
                    </span>
                  )}
                </div>
              </div>

              {/* Synopsis */}
              <div className="space-y-2">
                <h3 className="font-display text-xl font-bold">Synopsis</h3>
                <p className="text-muted-foreground leading-relaxed max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                  {anime.description || "No description available."}
                </p>
              </div>

              {/* Personal Notes */}
              <div className="space-y-2">
                <h3 className="font-display text-xl font-bold">Personal Notes</h3>
                {isEditing ? (
                  <Textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                    className="bg-card border-white/10 min-h-[100px]"
                    placeholder="Add your thoughts..."
                  />
                ) : (
                  <div className="bg-secondary/30 p-4 rounded-xl border border-white/5 min-h-[80px]">
                    {anime.notes ? (
                      <p className="italic text-gray-300">"{anime.notes}"</p>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">No notes added yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
