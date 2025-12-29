import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const anime = pgTable("anime", {
  id: serial("id").primaryKey(),
  malId: integer("mal_id").notNull(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  category: text("category").notNull(), // 'watched' | 'plan_to_watch'
  rating: integer("rating"),
  communityRating: doublePrecision("community_rating"),
  notes: text("notes"),
  type: text("type"),
  episodes: integer("episodes"),
  duration: text("duration"),
  releaseYear: integer("release_year"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnimeSchema = createInsertSchema(anime).omit({
  id: true,
  createdAt: true
});

export type Anime = typeof anime.$inferSelect;
export type InsertAnime = z.infer<typeof insertAnimeSchema>;
