import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertAnime } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export type JikanAnime = {
  mal_id: number;
  title: string;
  images: { jpg: { large_image_url: string; image_url: string } };
  synopsis: string;
  genres: Array<{ name: string }>;
  year: number;
  score: number;
  type: string;
  episodes: number;
  duration: string;
};

// ============================================
// BACKEND API HOOKS
// ============================================

export function useAnimeList() {
  return useQuery({
    queryKey: [api.anime.list.path],
    queryFn: async () => {
      const res = await fetch(api.anime.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch anime list");
      return api.anime.list.responses[200].parse(await res.json());
    },
  });
}

export function useAnime(id: number) {
  return useQuery({
    queryKey: [api.anime.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.anime.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch anime details");
      return api.anime.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

import { apiRequest } from "@/lib/queryClient";

export function useCreateAnime() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertAnime) => {
      const res = await apiRequest(
        api.anime.create.method,
        api.anime.create.path,
        data
      );
      return api.anime.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.anime.list.path] });
      toast({ title: "Added to Library", description: "Anime saved successfully." });
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
      const url = buildUrl(api.anime.update.path, { id });
      const res = await apiRequest(
        api.anime.update.method,
        url,
        updates
      );
      return api.anime.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.anime.list.path] });
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
      const url = buildUrl(api.anime.delete.path, { id });
      await apiRequest(api.anime.delete.method, url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.anime.list.path] });
      toast({ title: "Deleted", description: "Anime removed from library." });
    },
  });
}

// ============================================
// EXTERNAL API HOOKS (Jikan)
// ============================================

export function useJikanSearch(query: string) {
  return useQuery({
    queryKey: ["jikan", query],
    queryFn: async () => {
      if (!query || query.length < 3) return [];
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=8`);
      if (!res.ok) throw new Error("Failed to search Jikan");
      const data = await res.json();
      return data.data as JikanAnime[];
    },
    enabled: query.length >= 3,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
