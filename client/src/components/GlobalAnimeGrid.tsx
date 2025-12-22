import { motion } from "framer-motion";
import { Star, Plus } from "lucide-react";
import type { JikanAnime } from "@/hooks/use-anime";

interface GlobalAnimeGridProps {
    items: JikanAnime[];
    onSelect: (anime: JikanAnime) => void;
    isLoading?: boolean;
}

export function GlobalAnimeGrid({ items, onSelect, isLoading }: GlobalAnimeGridProps) {
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
                <GlobalAnimeCard key={anime.mal_id} anime={anime} onClick={onSelect} />
            ))}
        </div>
    );
}

function GlobalAnimeCard({ anime, onClick }: { anime: JikanAnime; onClick: (anime: JikanAnime) => void }) {
    const imageUrl = anime.images.jpg.large_image_url || anime.images.jpg.image_url;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative cursor-pointer"
            onClick={() => onClick(anime)}
        >
            {/* Poster Image */}
            <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg shadow-black/40 border border-white/5 relative z-10">
                <img
                    src={imageUrl}
                    alt={anime.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Add Overlay Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-primary/90 text-white rounded-full p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        <Plus className="w-8 h-8" />
                    </div>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                    <h3 className="font-display font-bold text-sm text-white mb-1 line-clamp-2 text-shadow text-center">
                        {anime.title}
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
                <h3 className="font-semibold text-sm text-white/90 line-clamp-1 truncate">{anime.title}</h3>
                <p className="text-xs text-muted-foreground">{anime.type || "TV"} • {anime.year || "?"}</p>
            </div>

        </motion.div>
    );
}
