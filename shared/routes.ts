import { z } from 'zod';
import { insertAnimeSchema, anime } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  anime: {
    list: {
      method: 'GET' as const,
      path: '/api/anime',
      responses: {
        200: z.array(z.custom<typeof anime.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/anime/:id',
      responses: {
        200: z.custom<typeof anime.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/anime',
      input: insertAnimeSchema,
      responses: {
        201: z.custom<typeof anime.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/anime/:id',
      input: insertAnimeSchema.partial(),
      responses: {
        200: z.custom<typeof anime.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/anime/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
