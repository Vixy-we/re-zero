import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app, httpServer } from '../server/index';
import { registerRoutes } from '../server/routes';

// Cache the route registration so it doesn't happen on every request
let routesRegistered = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!routesRegistered) {
        await registerRoutes(httpServer, app);
        routesRegistered = true;
    }

    // Vercel rewrite might strip the presence of /api prefix from req.url
    // but our Express app routes are defined with /api prefix.
    // We re-add it if missing to ensure routing works.
    const url = req.url || '';
    if (!url.startsWith('/api') && !url.includes('_next')) {
        req.url = '/api' + url;
    }

    // Forward request to Express app
    return app(req, res);
}
