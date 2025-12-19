import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertAnime } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export type JikanAnime = {
  mal_id: number;
  title: string;
  images: { jpg: { large_image_url: string; image_url: string } };
  synopsis: string;
  genres: Array<{ name: string }>;
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

export function useCreateAnime() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertAnime) => {
      const validated = api.anime.create.input.parse(data);
      const res = await fetch(api.anime.create.path, {
        method: api.anime.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.anime.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to add anime");
      }
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
      const validated = api.anime.update.input.parse(updates);
      const url = buildUrl(api.anime.update.path, { id });
      
      const res = await fetch(url, {
        method: api.anime.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update anime");
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
      const res = await fetch(url, { method: api.anime.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete anime");
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
