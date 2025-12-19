import { anime, type InsertAnime, type Anime } from "../shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getAnimeList(): Promise<Anime[]>;
  getAnime(id: number): Promise<Anime | undefined>;
  createAnime(anime: InsertAnime): Promise<Anime>;
  updateAnime(id: number, anime: Partial<InsertAnime>): Promise<Anime | undefined>;
  deleteAnime(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAnimeList(): Promise<Anime[]> {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(anime).orderBy(desc(anime.createdAt));
  }

  async getAnime(id: number): Promise<Anime | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [item] = await db.select().from(anime).where(eq(anime.id, id));
    return item;
  }

  async createAnime(insertAnime: InsertAnime): Promise<Anime> {
    if (!db) throw new Error("Database not initialized");
    // Ensure tags is treated correctly by Drizzle
    const [item] = await db.insert(anime).values({
      ...insertAnime,
      tags: insertAnime.tags || [],
    }).returning();
    return item;
  }

  async updateAnime(id: number, updates: Partial<InsertAnime>): Promise<Anime | undefined> {
    if (!db) throw new Error("Database not initialized");
    const [item] = await db
      .update(anime)
      .set(updates)
      .where(eq(anime.id, id))
      .returning();
    return item;
  }

  async deleteAnime(id: number): Promise<void> {
    if (!db) throw new Error("Database not initialized");
    await db.delete(anime).where(eq(anime.id, id));
  }
}

export class MemStorage implements IStorage {
  private anime: Map<number, Anime>;
  private currentId: number;

  constructor() {
    this.anime = new Map();
    this.currentId = 1;
  }

  async getAnimeList(): Promise<Anime[]> {
    return Array.from(this.anime.values()).sort((a, b) =>
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getAnime(id: number): Promise<Anime | undefined> {
    return this.anime.get(id);
  }

  async createAnime(insertAnime: InsertAnime): Promise<Anime> {
    const id = this.currentId++;
    const anime: Anime = {
      ...insertAnime,
      id,
      rating: insertAnime.rating ?? null,
      notes: insertAnime.notes ?? null,
      description: insertAnime.description ?? null,
      tags: (insertAnime.tags as string[]) ?? [],
      type: insertAnime.type ?? null,
      episodes: insertAnime.episodes ?? null,
      duration: insertAnime.duration ?? null,
      createdAt: new Date(),
    };
    this.anime.set(id, anime);
    return anime;
  }

  async updateAnime(id: number, updates: Partial<InsertAnime>): Promise<Anime | undefined> {
    const existing = this.anime.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.anime.set(id, updated);
    return updated;
  }

  async deleteAnime(id: number): Promise<void> {
    this.anime.delete(id);
  }
}

export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
