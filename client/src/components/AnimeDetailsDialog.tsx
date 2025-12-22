import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateAnime, useDeleteAnime } from "@/hooks/use-anime";
import type { Anime } from "@shared/schema";
import { Star, Trash2, X, Edit2, Save, Calendar, Clock, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface AnimeDetailsDialogProps {
  anime: Anime | null;
  onClose: () => void;
}

export function AnimeDetailsDialog({ anime, onClose }: AnimeDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const updateMutation = useUpdateAnime();
  const deleteMutation = useDeleteAnime();

  useEffect(() => {
    if (anime) {
      setRating(anime.rating?.toString() || "");
      setNotes(anime.notes || "");
      setCategory(anime.category);
      setTags(anime.tags || []);
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
      tags: tags,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (!anime) return;
    await deleteMutation.mutateAsync(anime.id);
    onClose();
    setShowDeleteAlert(false);
  };

  if (!anime) return null;

  return (
    <>
      <Dialog open={!!anime} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-zinc-950 border-white/10 text-white gap-0 shadow-2xl custom-scrollbar">

          {/* Cinematic Header Background */}
          <div className="relative h-[200px] w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/50 to-transparent z-10" />
            <img
              src={anime.imageUrl}
              alt={anime.title}
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute top-4 right-4 z-20">
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-black/40 hover:bg-white/20 text-white backdrop-blur-md transition-all">
                  <X className="w-5 h-5" />
                </Button>
              </DialogClose>
            </div>
          </div>

          <div className="grid md:grid-cols-[240px_1fr] gap-8 p-6 sm:p-10 -mt-32 relative z-20">

            {/* Left Column: Poster & Actions */}
            <div className="flex flex-col gap-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="rounded-lg overflow-hidden shadow-2xl border-4 border-white/10 bg-black aspect-[2/3]"
              >
                <img
                  src={anime.imageUrl}
                  alt={anime.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <div className="flex flex-col gap-2">
                {!isEditing ? (
                  <>
                    <Button
                      className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/5 backdrop-blur-sm h-10 shadow-lg"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={handleDelete}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 h-10 shadow-lg shadow-primary/20"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full hover:bg-white/10"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Info & Form */}
            <div className="pt-4 space-y-8">
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-display text-3xl sm:text-5xl font-bold mb-3 leading-tight text-white drop-shadow-lg"
                >
                  {anime.title}
                </motion.h2>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 font-medium">
                  <span className="flex items-center bg-white/5 px-2.5 py-1 rounded-md border border-white/5 backdrop-blur-md">
                    <Calendar className="w-4 h-4 mr-2 text-primary" />
                    {anime.releaseYear || (anime.createdAt ? new Date(anime.createdAt).getFullYear() : 'Unknown')}
                    {/* Displaying Release Year or Added Year as fallback */}
                  </span>

                  {anime.episodes && (
                    <span className="flex items-center bg-white/5 px-2.5 py-1 rounded-md border border-white/5 backdrop-blur-md">
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      {anime.episodes} eps
                    </span>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {anime.tags?.map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-md bg-primary/20 text-primary-foreground text-xs font-semibold border border-primary/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                {/* Grid: Rating & Status */}
                <div className="grid grid-cols-2 gap-8 border-b border-white/5 pb-6">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">User Rating</Label>
                    {isEditing ? (
                      <div className="relative">
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={rating}
                          onChange={e => setRating(e.target.value)}
                          className="bg-black/20 border-white/10 pl-9 h-10 font-mono text-lg"
                        />
                        <Star className="w-4 h-4 text-yellow-500 absolute left-3 top-3" />
                      </div>
                    ) : (
                      <div className="flex items-end gap-2">
                        <Star className="w-8 h-8 fill-yellow-500 text-yellow-500" />
                        <span className="text-4xl font-bold leading-none">{anime.rating || "--"}</span>
                        <span className="text-lg text-muted-foreground font-medium mb-1">/10</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Shelf Status</Label>
                    {isEditing ? (
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-black/20 border-white/10 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plan_to_watch">Plan to Watch</SelectItem>
                          <SelectItem value="watched">Watched</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border ${anime.category === 'watched'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                        {anime.category === 'watched' ? '● Completed' : '○ Plan to Watch'}
                      </div>


                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-3 pb-6 border-b border-white/5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tags</Label>
                    <div className="flex flex-wrap gap-2">
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
                    <Input
                      placeholder="Add tag + Enter"
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
                      className="bg-black/20 border-white/10 h-9 text-sm"
                    />
                  </div>
                )}

                {/* Synopsis */}
                <div className="space-y-3">
                  <h3 className="tex-sm font-bold text-gray-200 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" /> Synopsis
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    {anime.description || "No description available."}
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">My Notes</Label>
                  {isEditing ? (
                    <Textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="bg-black/20 border-white/10 min-h-[100px] resize-none focus:ring-primary/50"
                      placeholder="Add your thoughts about this series..."
                    />
                  ) : (
                    <div className="min-h-[60px] text-gray-300 italic text-sm">
                      {anime.notes ? `"${anime.notes}"` : <span className="text-muted-foreground/50">No personal notes added.</span>}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete
              <span className="font-bold text-white"> {anime.title} </span>
              from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 text-white hover:bg-red-600 border-red-500">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
