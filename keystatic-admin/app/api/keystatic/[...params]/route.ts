import { makeRouteHandler } from '@keystatic/next/route-handler';
import config from '../../../../keystatic.config';

// Force dynamic — prevents Next.js from evaluating at build time
// (which would fail without GitHub credentials)
export const dynamic = 'force-dynamic';

export const { POST, GET } = makeRouteHandler({ config });
