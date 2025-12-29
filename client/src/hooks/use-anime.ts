import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { InsertAnime, Anime } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// Helper to map DB snake_case to Frontend camelCase
const mapToAnime = (row: any): Anime => ({
  ...row,
  malId: row.mal_id,
  imageUrl: row.image_url,
  releaseYear: row.release_year,
  communityRating: row.community_rating,
  createdAt: row.created_at ? new Date(row.created_at) : null,
});

// Helper to map Frontend camelCase to DB snake_case
const mapToDb = (data: Partial<InsertAnime> & { createdAt?: Date }) => {
  const { malId, imageUrl, releaseYear, communityRating, createdAt, ...rest } = data;
  return {
    ...rest,
    ...(malId !== undefined && { mal_id: malId }),
    ...(imageUrl !== undefined && { image_url: imageUrl }),
    ...(releaseYear !== undefined && { release_year: releaseYear }),
    ...(communityRating !== undefined && { community_rating: communityRating }),
    // created_at is automatic or managed elsewhere usually
  };
};

export type JikanAnime = {
  mal_id: number;
  title: string;
  title_english?: string; // Nullable in API
  title_japanese?: string;
  images: { jpg: { large_image_url: string; image_url: string } };
  synopsis: string;
  genres: Array<{ name: string }>;
  year: number;
  score: number;
  type: string;
  episodes: number;
  duration: string;
  aired: { from: string };
};

export function useAnimeList() {
  return useQuery({
    queryKey: ["anime-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapToAnime);
    },
  });
}

export function useAnime(id: number) {
  return useQuery({
    queryKey: ["anime", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anime")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapToAnime(data);
    },
    enabled: !!id,
  });
}

export function useCreateAnime() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertAnime) => {
      const dbData = mapToDb(data);
      const { data: created, error } = await supabase
        .from("anime")
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;
      return mapToAnime(created);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["anime-list"] });
      toast({ title: "Added to Library", description: `${data.title} saved successfully.`, duration: 2000 });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });
}

export function useUpdateAnime() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertAnime>) => {
      const dbData = mapToDb(updates);
      const { data: updated, error } = await supabase
        .from("anime")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapToAnime(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anime-list"] });
      toast({ title: "Updated", description: "Changes saved." });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });
}

export function useDeleteAnime() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("anime").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anime-list"] });
      toast({ title: "Deleted", description: "Anime removed from library." });
    },
  });
}

// ============================================
// EXTERNAL API HOOKS (Jikan)
// ============================================

export function useJikanSearch(query: string, type?: string | null) {
  return useQuery({
    queryKey: ["jikan", query, type],
    queryFn: async () => {
      if (!query || query.length < 3) return [];
      let url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=12`;
      if (type && type !== "all") {
        url += `&type=${type}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to search Jikan");
      const data = await res.json();
      return data.data as JikanAnime[];
    },
    enabled: query.length >= 3,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

const GENRE_MAP: Record<string, number> = {
  "action": 1, "adventure": 2, "rac": 3, "cars": 3, "comedy": 4, "avante garde": 5,
  "demons": 6, "mystery": 7, "drama": 8, "ecchi": 9, "fantasy": 10, "game": 11,
  "hentai": 12, "historical": 13, "horror": 14, "kids": 15, "martial arts": 17,
  "mecha": 18, "music": 19, "parody": 20, "samurai": 21, "romance": 22,
  "school": 23, "sci-fi": 24, "scifi": 24, "shoujo": 25, "girls love": 26, "gl": 26, "yuri": 26,
  "shounen": 27, "shonen": 27, "boys love": 28, "bl": 28, "yao": 28, "space": 29,
  "sports": 30, "super power": 31, "vampire": 32, "harem": 35, "slice of life": 36, "sol": 36,
  "supernatural": 37, "military": 38, "police": 39, "psychological": 40,
  "thriller": 41, "suspense": 41, "seinen": 42, "josei": 43,
  "award winning": 46, "gourmet": 47, "work life": 48, "erotica": 49,
  "isekai": 62, "cyberpunk": 50, "magical girl": 81
};

export function useJikanExplore(type?: string | null, filter?: string | null, includeTags?: string, excludeTags?: string) {
  return useInfiniteQuery({
    queryKey: ["jikan-explore", type, filter, includeTags, excludeTags],
    queryFn: async ({ pageParam = 1 }) => {
      let url = `https://api.jikan.moe/v4/anime?page=${pageParam}&limit=24`;

      // Defaults
      let orderBy = "members"; // popularity
      let sort = "desc";
      let status = "";

      // 1. Map simple filters to API params
      if (filter === "top_rated") {
        orderBy = "score";
        // status = "complete"; 
      } else if (filter === "airing") {
        status = "airing";
        orderBy = "members"; // Popular airing
      } else if (filter === "upcoming") {
        status = "upcoming";
        orderBy = "members";
      } else if (filter === "just_released") {
        status = "airing";
        orderBy = "start_date";
      } else {
        // "bypopularity" or default
        orderBy = "members";
      }

      url += `&order_by=${orderBy}&sort=${sort}`;
      if (status) url += `&status=${status}`;

      // 2. Type Filter
      if (type && type !== "all") {
        url += `&type=${type}`;
      }

      // 3. Tag Filters (Name -> ID)
      const parseTags = (input: string) => input.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

      if (includeTags) {
        const ids = parseTags(includeTags).map(t => GENRE_MAP[t]).filter(Boolean);
        if (ids.length > 0) url += `&genres=${ids.join(',')}`;
      }

      if (excludeTags) {
        const ids = parseTags(excludeTags).map(t => GENRE_MAP[t]).filter(Boolean);
        if (ids.length > 0) url += `&genres_exclude=${ids.join(',')}`;
      }

      // Delay to avoid hitting rate limit too fast if scrolling aggressively
      await new Promise(resolve => setTimeout(resolve, 500));

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch explore data");
      const data = await res.json();

      let items = data.data as JikanAnime[];

      // Client-side filter for "just_released" future dates
      if (filter === "just_released") {
        const now = new Date();
        items = items.filter(a => a.aired?.from && new Date(a.aired.from) <= now);
      }

      return {
        data: items,
        nextPage: data.pagination?.has_next_page ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 60,
  });
}

export function useJikanAnimeById(malId: number | null) {
  return useQuery({
    queryKey: ["jikan-id", malId],
    queryFn: async () => {
      if (!malId) return null;
      // Staggered delay to avoid rate limits (Jikan is 3 req/sec)
      // We use a random jitter so multiple cards don't hit at once
      const jitter = Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, jitter));
      const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}/full`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.data as JikanAnime;
    },
    enabled: !!malId,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// ============================================
// RECOMMENDATION HOOKS
// ============================================

export function useJikanSuggestions(genresInclude: number[], genresExclude: number[]) {
  return useQuery({
    queryKey: ["jikan-suggestions", genresInclude, genresExclude],
    queryFn: async () => {
      // Base recommendation logic:
      // Jikan API doesn't have a direct "personalized recommendation" endpoint in V4 based on POST data.
      // We simulate it using the Search endpoint with detailed filters.
      // We primarily filter by Genre inclusion/exclusion.

      let url = `https://api.jikan.moe/v4/anime?order_by=popularity&sfw=true&min_score=7&limit=24`;

      if (genresInclude.length > 0) {
        url += `&genres=${genresInclude.join(',')}`;
      }

      if (genresExclude.length > 0) {
        url += `&genres_exclude=${genresExclude.join(',')}`;
      }

      // Add a randomizer factor (page) if it's broad
      // To keep it "fresh", we could pick a random page if filters are broad
      // For now, page 1 is safest for relevancy.

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      const data = await res.json();
      return data.data as JikanAnime[];
    },
    enabled: false, // Trigger manual execution
  });
}
