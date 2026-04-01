import type { APIRoute } from 'astro';

export const prerender = false;

const VIKUNJA_HOST = import.meta.env.VITE_VIKUNJA_HOST || '';
const VIKUNJA_TOKEN = import.meta.env.VITE_VIKUNJA_TOKEN || '';

export const GET: APIRoute = async ({ params }) => {
  if (!VIKUNJA_HOST || !VIKUNJA_TOKEN) {
    return new Response(JSON.stringify({ error: 'Vikunja not configured' }), { status: 503 });
  }

  const url = `${VIKUNJA_HOST}/api/v1/${params.path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${VIKUNJA_TOKEN}` },
  });

  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
};
