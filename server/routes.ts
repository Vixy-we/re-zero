import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "../shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // GET /api/anime
  app.get(api.anime.list.path, async (req, res) => {
    const animeList = await storage.getAnimeList();
    res.json(animeList);
  });

  // GET /api/anime/:id
  app.get(api.anime.get.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    const anime = await storage.getAnime(id);
    if (!anime) {
      return res.status(404).json({ message: "Anime not found" });
    }
    res.json(anime);
  });

  // POST /api/anime
  app.post(api.anime.create.path, async (req, res) => {
    try {
      const input = api.anime.create.input.parse(req.body);
      console.log("Creating anime with:", JSON.stringify(input, null, 2));
      const anime = await storage.createAnime(input);
      res.status(201).json(anime);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // PUT /api/anime/:id
  app.put(api.anime.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      const input = api.anime.update.input.parse(req.body);
      const updated = await storage.updateAnime(id, input);
      if (!updated) {
        return res.status(404).json({ message: "Anime not found" });
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // DELETE /api/anime/:id
  app.delete(api.anime.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    await storage.deleteAnime(id);
    res.status(204).send();
  });

  return httpServer;
}
