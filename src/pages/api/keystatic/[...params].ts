/**
 * Custom Keystatic API route that fixes the redirect URL when behind
 * a reverse proxy (Traefik/Coolify). The default handler uses
 * request.url which shows localhost:4321 inside Docker.
 * We rewrite the request URL using X-Forwarded headers before passing
 * to the Keystatic handler.
 */
import type { APIContext } from 'astro';
import { makeHandler } from '@keystatic/astro/api';
// @ts-expect-error virtual module
import config from 'virtual:keystatic-config';

export const prerender = false;

const handler = makeHandler({ config });

export const ALL = async (context: APIContext) => {
  // Rewrite request URL to use the forwarded host/proto if behind a proxy
  const forwardedHost = context.request.headers.get('x-forwarded-host');
  const forwardedProto = context.request.headers.get('x-forwarded-proto') || 'https';

  if (forwardedHost) {
    const originalUrl = new URL(context.request.url);
    const newUrl = `${forwardedProto}://${forwardedHost}${originalUrl.pathname}${originalUrl.search}`;
    // Create a new request with the corrected URL
    const newRequest = new Request(newUrl, {
      method: context.request.method,
      headers: context.request.headers,
      body: context.request.body,
      // @ts-expect-error duplex is needed for streaming bodies
      duplex: 'half',
    });
    // Replace the request in the context
    return handler({ ...context, request: newRequest });
  }

  return handler(context);
};
