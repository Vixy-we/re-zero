import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const anime = pgTable("anime", {
  id: serial("id").primaryKey(),
  malId: integer("mal_id").notNull(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  tags: jsonb("tags").$type<string[]>().default([]),
  category: text("category").notNull(), // 'watched' | 'plan_to_watch'
  rating: integer("rating"),
  notes: text("notes"),
  type: text("type"),
  episodes: integer("episodes"),
  duration: text("duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnimeSchema = createInsertSchema(anime).omit({
  id: true,
  createdAt: true
});

export type Anime = typeof anime.$inferSelect;
export type InsertAnime = z.infer<typeof insertAnimeSchema>;
