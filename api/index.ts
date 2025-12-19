import { app, httpServer } from '../server/index';
import { registerRoutes } from '../server/routes';

// Cache the route registration so it doesn't happen on every request
let routesRegistered = false;

export default async function handler(req, res) {
    if (!routesRegistered) {
        await registerRoutes(httpServer, app);
        routesRegistered = true;
    }

    // Vercel rewrite might strip the presence of /api prefix from req.url
    // but our Express app routes are defined with /api prefix.
    // We re-add it if missing to ensure routing works.
    if (req.url && !req.url.startsWith('/api')) {
        req.url = '/api' + req.url;
    }

    // Forward request to Express app
    return app(req, res);
}
