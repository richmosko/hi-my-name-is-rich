import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const host = import.meta.env.VIKUNJA_HOST || import.meta.env.VITE_VIKUNJA_HOST || '';
  const token = import.meta.env.VIKUNJA_TOKEN || import.meta.env.VITE_VIKUNJA_TOKEN || '';

  if (!host || !token) {
    return new Response(JSON.stringify({ error: 'Vikunja not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Forward query params from the original request
  const requestUrl = new URL(request.url);
  const queryString = requestUrl.search;
  const url = `${host}/api/v1/${params.path}${queryString}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return new Response(res.body, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Vikunja proxy error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
