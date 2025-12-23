import { motion } from "framer-motion";
import { Star, Plus, Check } from "lucide-react";
import type { JikanAnime } from "@/hooks/use-anime";

interface GlobalAnimeGridProps {
    items: JikanAnime[];
    onSelect: (anime: JikanAnime) => void;
    isLoading?: boolean;
    libraryIds?: Set<number>;
    onQuickAdd?: (anime: JikanAnime) => void;
}

export function GlobalAnimeGrid({ items, onSelect, isLoading, libraryIds, onQuickAdd }: GlobalAnimeGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 large-grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-12 pb-20">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                No results found. Try a different search.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 large-grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-12 pb-20">
            {items.map((anime) => (
                <GlobalAnimeCard
                    key={anime.mal_id}
                    anime={anime}
                    onClick={onSelect}
                    isAdded={libraryIds?.has(anime.mal_id)}
                    onQuickAdd={onQuickAdd}
                />
            ))}
        </div>
    );
}

function GlobalAnimeCard({ anime, onClick, isAdded, onQuickAdd }: { anime: JikanAnime; onClick: (anime: JikanAnime) => void; isAdded?: boolean; onQuickAdd?: (anime: JikanAnime) => void }) {
    const imageUrl = anime.images.jpg.large_image_url || anime.images.jpg.image_url;
    const displayTitle = anime.title_english || anime.title;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative cursor-pointer ${isAdded ? 'opacity-60 grayscale-[0.5] hover:grayscale-0 hover:opacity-100' : ''}`}
            onClick={() => onClick(anime)}
        >
            {/* Poster Image */}
            <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg shadow-black/40 border border-white/5 relative z-10">
                <img
                    src={imageUrl}
                    alt={displayTitle}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Status Badge for Added Items */}
                {isAdded && (
                    <div className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur-md rounded-full p-1.5 border border-white/20">
                        <Check className="w-4 h-4 text-green-400" />
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Add Overlay Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isAdded && onQuickAdd) onQuickAdd(anime);
                        }}
                        className={`pointer-events-auto text-white rounded-full p-4 shadow-lg transform scale-90 group-hover:scale-100 transition-transform ${isAdded ? 'bg-green-500/90' : 'bg-primary/90 cursor-pointer hover:bg-primary hover:scale-110'}`}
                        title={isAdded ? "Already in Library" : "Quick Add to Plan to Watch"}
                    >
                        {isAdded ? <Check className="w-12 h-12" /> : <Plus className="w-12 h-12" />}
                    </div>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                    <h3 className="font-display font-bold text-sm text-white mb-1 line-clamp-2 text-shadow text-center">
                        {displayTitle}
                    </h3>
                    <div className="flex justify-center items-center gap-2 text-xs text-gray-300">
                        <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            {anime.score || "N/A"}
                        </span>
                        <span>•</span>
                        <span>{anime.year || "Unknown"}</span>
                    </div>
                </div>
            </div>

            {/* Static Title below card for normal view */}
            <div className="mt-3 group-hover:opacity-0 transition-opacity duration-200">
                <h3 className={`font-semibold text-sm line-clamp-1 truncate ${isAdded ? 'text-green-400' : 'text-white/90'}`}>
                    {isAdded ? '✓ ' + displayTitle : displayTitle}
                </h3>
                <p className="text-xs text-muted-foreground">{anime.type || "TV"} • {anime.year || "?"}</p>
            </div>

        </motion.div>
    );
}
