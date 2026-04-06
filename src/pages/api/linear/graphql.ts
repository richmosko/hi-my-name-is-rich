import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  // Read at runtime (not build time) so the key doesn't get baked into the bundle
  const apiKey = process.env.LINEAR_API_KEY || '';

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Linear not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.text();

    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body,
    });

    return new Response(res.body, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Linear proxy error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
