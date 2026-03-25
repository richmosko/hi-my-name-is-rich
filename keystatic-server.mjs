/**
 * Keystatic API server for local development mode.
 *
 * Handles /api/keystatic/* requests — reads/writes MDX files on disk.
 * Run alongside the Vite dev server:
 *
 *   npm run keystatic    # starts this server on port 3333
 *   npm run dev          # starts Vite on port 5173 (proxies /api/keystatic → 3333)
 */

import http from 'node:http';

// Dynamic import — Keystatic's ESM exports need async import
const { makeGenericAPIRouteHandler } = await import('@keystatic/core/api/generic');

// Import the config — need to handle TypeScript/TSX
// For local dev, we'll use a simplified JS version
const config = (await import('./keystatic.config.tsx')).default;

const handler = makeGenericAPIRouteHandler({
  config,
  localBaseDirectory: process.cwd(),
});

const server = http.createServer(async (req, res) => {
  // CORS headers for Vite dev server
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // Adapt Node.js IncomingMessage to Keystatic's request format
    const url = new URL(req.url || '/', `http://localhost:3333`);
    const body = await new Promise((resolve) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const keystaticReq = {
      method: req.method || 'GET',
      url: url.toString(),
      headers: { get: (name) => req.headers[name.toLowerCase()] || null },
      json: () => JSON.parse(body.toString() || '{}'),
    };

    const keystaticRes = await handler(keystaticReq);

    // Write response
    const headers = keystaticRes.headers || {};
    if (headers instanceof Headers) {
      headers.forEach((value, key) => res.setHeader(key, value));
    } else if (Array.isArray(headers)) {
      for (const [key, value] of headers) res.setHeader(key, value);
    }

    res.writeHead(keystaticRes.status || 200);
    if (keystaticRes.body) {
      res.end(keystaticRes.body);
    } else {
      res.end();
    }
  } catch (err) {
    console.error('Keystatic API error:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message }));
  }
});

const PORT = 3333;
server.listen(PORT, () => {
  console.log(`\n  🔑 Keystatic API server running at http://localhost:${PORT}`);
  console.log(`  📝 Admin UI: http://localhost:5173/keystatic\n`);
});
