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

const { makeGenericAPIRouteHandler } = await import('@keystatic/core/api/generic');
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
    const url = new URL(req.url || '/', `http://localhost:3333`);

    // Buffer the full request body (support large uploads up to 50MB)
    const body = await new Promise((resolve, reject) => {
      const chunks = [];
      let size = 0;
      const MAX_SIZE = 50 * 1024 * 1024; // 50MB
      req.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_SIZE) {
          reject(new Error('Request body too large'));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });

    const contentType = req.headers['content-type'] || '';

    const keystaticReq = {
      method: req.method || 'GET',
      url: url.toString(),
      headers: { get: (name) => req.headers[name.toLowerCase()] || null },
      json: () => {
        // Only parse as JSON if content-type is JSON
        if (contentType.includes('application/json')) {
          const str = body.toString();
          return JSON.parse(str || '{}');
        }
        // For other content types (multipart, etc.), return the raw body as-is
        // Keystatic may call .json() but the handler should handle non-JSON
        return JSON.parse(body.toString() || '{}');
      },
      body: body,
      arrayBuffer: () => Promise.resolve(body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)),
    };

    const keystaticRes = await handler(keystaticReq);

    // Write response headers
    const headers = keystaticRes.headers;
    if (headers instanceof Headers) {
      headers.forEach((value, key) => res.setHeader(key, value));
    } else if (Array.isArray(headers)) {
      for (const [key, value] of headers) res.setHeader(key, value);
    } else if (headers && typeof headers === 'object') {
      for (const [key, value] of Object.entries(headers)) {
        if (value) res.setHeader(key, String(value));
      }
    }

    res.writeHead(keystaticRes.status || 200);
    if (keystaticRes.body) {
      res.end(keystaticRes.body);
    } else {
      res.end();
    }
  } catch (err) {
    console.error('Keystatic API error:', err.message);
    if (!res.headersSent) {
      res.writeHead(err.message === 'Request body too large' ? 413 : 500);
      res.end(JSON.stringify({ error: err.message }));
    }
  }
});

const PORT = 3333;
server.listen(PORT, () => {
  console.log(`\n  🔑 Keystatic API server running at http://localhost:${PORT}`);
  console.log(`  📝 Admin UI: http://localhost:5173/keystatic\n`);
});
