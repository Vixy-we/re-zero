import { anime, type InsertAnime, type Anime } from "@shared/schema";
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
    return await db.select().from(anime).orderBy(desc(anime.createdAt));
  }

  async getAnime(id: number): Promise<Anime | undefined> {
    const [item] = await db.select().from(anime).where(eq(anime.id, id));
    return item;
  }

  async createAnime(insertAnime: InsertAnime): Promise<Anime> {
    const [item] = await db.insert(anime).values(insertAnime).returning();
    return item;
  }

  async updateAnime(id: number, updates: Partial<InsertAnime>): Promise<Anime | undefined> {
    const [item] = await db
      .update(anime)
      .set(updates)
      .where(eq(anime.id, id))
      .returning();
    return item;
  }

  async deleteAnime(id: number): Promise<void> {
    await db.delete(anime).where(eq(anime.id, id));
  }
}

export const storage = new DatabaseStorage();
