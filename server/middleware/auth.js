import supabase from '../lib/supabase.js';

async function authMiddleware(req, res, next) {
    try {
        if (!supabase) {
            return res.status(503).json({
                error: 'Authentication service unavailable. Supabase is not configured.',
            });
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or malformed authorization header.' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided.' });
        }

        const {
            data: { user },
            error,
        } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }

        req.user = user;
        return next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Internal authentication error.' });
    }
}

export default authMiddleware;
