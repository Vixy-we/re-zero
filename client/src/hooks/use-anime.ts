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

// ============================================
// ROBUST JIKAN FETCH WITH RETRY
// ============================================

async function jikanFetch(url: string, retries = 3): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url);

      if (res.status === 429) {
        // Rate limited — wait with exponential backoff then retry
        const wait = Math.min(1000 * Math.pow(2, attempt), 8000);
        console.warn(`[Jikan] 429 rate limited, retrying in ${wait}ms (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      if (!res.ok) {
        throw new Error(`Jikan HTTP ${res.status}`);
      }

      return await res.json();
    } catch (error: any) {
      if (error.message?.includes("429") || attempt < retries - 1) {
        const wait = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Jikan: max retries exceeded");
}

// ============================================
// RATE LIMITING QUEUE
// ============================================

class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private readonly minDelay = 400; // ~2.5 requests per second (safe for Jikan)

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLast = now - this.lastRequestTime;

      if (timeSinceLast < this.minDelay) {
        await new Promise(r => setTimeout(r, this.minDelay - timeSinceLast));
      }

      const task = this.queue.shift();
      if (task) {
        this.lastRequestTime = Date.now();
        await task();
      }
    }

    this.isProcessing = false;
  }
}

const jikanQueue = new RequestQueue();

// ============================================
// GENRE MAP
// ============================================

export const GENRE_MAP: Record<string, number> = {
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

// ============================================
// ANILIST GRAPHQL WRAPPER (Alternative to Jikan/Kitsu)
// We use AniList instead of Kitsu because AniList provides `idMal` natively,
// ensuring compatibility with Smart Engine and Library tracking.
// ============================================

export async function fetchAniList(query: string, variables: any) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ query, variables })
  });

  if (!res.ok) {
    if (res.status === 429) {
      const wait = res.headers.get('Retry-After') ? parseInt(res.headers.get('Retry-After')!) * 1000 : 2000;
      await new Promise(r => setTimeout(r, wait));
      return fetchAniList(query, variables); // Retry once
    }
    throw new Error(`AniList HTTP ${res.status}`);
  }
  return res.json();
}

export function mapAniListToJikan(media: any): JikanAnime {
  return {
    mal_id: media.idMal || media.id, // Fallback to anilist ID if MAL id missing
    title: media.title.english || media.title.romaji || "Unknown Title",
    title_english: media.title.english,
    title_japanese: media.title.romaji,
    images: { jpg: { large_image_url: media.coverImage.extraLarge || media.coverImage.large, image_url: media.coverImage.large } },
    synopsis: media.description?.replace(/<[^>]*>?/gm, '') || "",
    genres: (media.genres || []).map((g: string) => ({ name: g })),
    year: media.seasonYear || media.startDate?.year || 0,
    score: media.averageScore ? media.averageScore / 10 : 0, // AniList is 0-100, Jikan is 0-10
    type: media.format || "TV",
    episodes: media.episodes || 0,
    duration: `${media.duration || 24} min per ep`,
    aired: { from: media.startDate?.year ? `${media.startDate.year}-${media.startDate.month || 1}-${media.startDate.day || 1}` : "" }
  };
}

const ANILIST_SEARCH_QUERY = `
query ($page: Int, $perPage: Int, $search: String, $sort: [MediaSort], $format: MediaFormat, $status: MediaStatus, $genres: [String], $genresExclude: [String]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage }
    media(search: $search, type: ANIME, sort: $sort, format: $format, status: $status, genre_in: $genres, genre_not_in: $genresExclude) {
      id
      idMal
      title { romaji english }
      coverImage { large extraLarge }
      description
      genres
      seasonYear
      averageScore
      format
      episodes
      duration
      startDate { year month day }
    }
  }
}
`;

// ============================================
// HOOKS
// ============================================

export type ApiSource = "jikan" | "anilist";

export function useJikanSearch(query: string, type?: string | null, source: ApiSource = "jikan") {
  return useInfiniteQuery({
    queryKey: ["search", source, query, type],
    queryFn: async ({ pageParam = 1 }) => {
      if (!query || query.length < 3) return { data: [], nextPage: undefined };

      if (source === "anilist") {
        const variables: any = { search: query, page: pageParam, perPage: 24, sort: ["POPULARITY_DESC"] };
        if (type && type !== "all") {
           variables.format = type.toUpperCase() === "TV" ? "TV" : type.toUpperCase();
        }
        const response = await fetchAniList(ANILIST_SEARCH_QUERY, variables);
        return {
          data: (response.data?.Page?.media || []).map(mapAniListToJikan),
          nextPage: response.data?.Page?.pageInfo?.hasNextPage ? pageParam + 1 : undefined,
        };
      }

      // Jikan fallback
      let url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&page=${pageParam}&limit=24`;
      if (type && type !== "all") {
        url += `&type=${type}`;
      }

      return jikanQueue.add(async () => {
        const json = await jikanFetch(url);
        return {
          data: (json.data || []) as JikanAnime[],
          nextPage: json.pagination?.has_next_page ? pageParam + 1 : undefined,
        };
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: query.length >= 3,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 8000),
  });
}

export function useJikanExplore(type?: string | null, filter?: string | null, includeTags?: string, excludeTags?: string, source: ApiSource = "jikan") {
  return useInfiniteQuery({
    queryKey: ["explore", source, type, filter, includeTags, excludeTags],
    queryFn: async ({ pageParam = 1 }) => {
      if (source === "anilist") {
        const variables: any = { page: pageParam, perPage: 24 };
        
        let sort = "POPULARITY_DESC";
        if (filter === "top_rated") sort = "SCORE_DESC";
        else if (filter === "just_released") sort = "START_DATE_DESC";
        variables.sort = [sort];

        if (filter === "airing" || filter === "just_released") variables.status = "RELEASING";
        else if (filter === "upcoming") variables.status = "NOT_YET_RELEASED";

        if (type && type !== "all") variables.format = type.toUpperCase() === "TV" ? "TV" : type.toUpperCase();

        const parseTags = (input: string) => input.split(',').map(t => t.trim()).filter(Boolean);
        if (includeTags) variables.genres = parseTags(includeTags);
        if (excludeTags) variables.genresExclude = parseTags(excludeTags);

        const response = await fetchAniList(ANILIST_SEARCH_QUERY, variables);
        return {
          data: (response.data?.Page?.media || []).map(mapAniListToJikan),
          nextPage: response.data?.Page?.pageInfo?.hasNextPage ? pageParam + 1 : undefined,
        };
      }

      // Jikan fallback
      let url = `https://api.jikan.moe/v4/anime?page=${pageParam}&limit=24`;

      // Defaults
      let orderBy = "members"; // popularity
      let jikanSort = "desc";
      let status = "";

      // 1. Map simple filters to API params
      if (filter === "top_rated") {
        orderBy = "score";
      } else if (filter === "airing") {
        status = "airing";
        orderBy = "members";
      } else if (filter === "upcoming") {
        status = "upcoming";
        orderBy = "members";
      } else if (filter === "just_released") {
        status = "airing";
        orderBy = "start_date";
      } else {
        orderBy = "members";
      }

      url += `&order_by=${orderBy}&sort=${jikanSort}`;
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

      return jikanQueue.add(async () => {
        const json = await jikanFetch(url);

        let items = (json.data || []) as JikanAnime[];

        // Client-side filter for "just_released" future dates
        if (filter === "just_released") {
          const now = new Date();
          items = items.filter(a => a.aired?.from && new Date(a.aired.from) <= now);
        }

        return {
          data: items,
          nextPage: json.pagination?.has_next_page ? pageParam + 1 : undefined,
        };
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 60,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 8000),
  });
}

export function useJikanAnimeById(malId: number | null) {
  return useQuery({
    queryKey: ["jikan-id", malId],
    queryFn: async () => {
      if (!malId) return null;

      return jikanQueue.add(async () => {
        const json = await jikanFetch(`https://api.jikan.moe/v4/anime/${malId}/full`);
        return json.data as JikanAnime;
      });
    },
    enabled: !!malId,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: (failureCount, error) => {
      if (failureCount < 3) return true;
      return false;
    },
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 8000),
  });
}

// ============================================
// RECOMMENDATION HOOKS
// ============================================

export function useJikanSuggestions(genresInclude: number[], genresExclude: number[]) {
  return useQuery({
    queryKey: ["jikan-suggestions", genresInclude, genresExclude],
    queryFn: async () => {
      let url = `https://api.jikan.moe/v4/anime?order_by=popularity&sfw=true&min_score=7&limit=24`;

      if (genresInclude.length > 0) {
        url += `&genres=${genresInclude.join(',')}`;
      }

      if (genresExclude.length > 0) {
        url += `&genres_exclude=${genresExclude.join(',')}`;
      }

      return jikanQueue.add(async () => {
        const json = await jikanFetch(url);
        return (json.data || []) as JikanAnime[];
      });
    },
    enabled: false, // Trigger manual execution
  });
}
