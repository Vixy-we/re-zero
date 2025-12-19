import { motion } from "framer-motion";
import type { Anime } from "@shared/schema";
import { Star, CheckCircle, Clock } from "lucide-react";

interface AnimeCardProps {
  anime: Anime;
  onClick: (anime: Anime) => void;
}

export function AnimeCard({ anime, onClick }: AnimeCardProps) {
  return (
    <motion.div
      layoutId={`card-${anime.id}`}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative cursor-pointer"
      onClick={() => onClick(anime)}
    >
      {/* 3D Book Spine Effect */}
      <div className="absolute left-0 top-1 bottom-1 w-2 bg-white/5 rounded-l-md z-0 transform -translate-x-1" />
      
      {/* Poster Image */}
      <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg shadow-black/40 border border-white/5 relative z-10">
        <img
          src={anime.imageUrl}
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        
        {/* Status Indicator */}
        <div className="absolute top-2 right-2">
          {anime.category === "watched" ? (
            <div className="bg-green-500/20 backdrop-blur-md p-1.5 rounded-full border border-green-500/50">
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
          ) : (
            <div className="bg-amber-500/20 backdrop-blur-md p-1.5 rounded-full border border-amber-500/50">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
          )}
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-display font-bold text-lg leading-tight text-white mb-1 line-clamp-2 text-shadow">
            {anime.title}
          </h3>
          
          <div className="flex items-center gap-2 text-sm text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
            {anime.rating && (
              <div className="flex items-center text-accent">
                <Star className="w-3.5 h-3.5 fill-current mr-1" />
                <span className="font-mono font-bold">{anime.rating}</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {anime.tags && anime.tags.length > 0 ? anime.tags[0] : "No tags"}
            </span>
          </div>
        </div>
      </div>
      
      {/* Reflection for floor effect */}
      <div className="absolute -bottom-4 left-2 right-2 h-4 bg-gradient-to-b from-primary/10 to-transparent blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
    </motion.div>
  );
}
