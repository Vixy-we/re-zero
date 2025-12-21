import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InsertAnime, Anime } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// Helper to map DB snake_case to Frontend camelCase
const mapToAnime = (row: any): Anime => ({
  ...row,
  malId: row.mal_id,
  imageUrl: row.image_url,
  createdAt: row.created_at ? new Date(row.created_at) : null,
});

// Helper to map Frontend camelCase to DB snake_case
const mapToDb = (data: Partial<InsertAnime> & { createdAt?: Date }) => {
  const { malId, imageUrl, createdAt, ...rest } = data;
  return {
    ...rest,
    ...(malId !== undefined && { mal_id: malId }),
    ...(imageUrl !== undefined && { image_url: imageUrl }),
    // created_at is automatic or managed elsewhere usually
  };
};

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anime-list"] });
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
