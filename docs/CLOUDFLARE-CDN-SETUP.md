# Cloudflare CDN Setup

This guide walks through setting up Cloudflare's free CDN in front of your Coolify-hosted blog on Hetzner EU, so static assets are served from edge nodes worldwide while Remark42 comment traffic still reaches your origin server.

## Why Cloudflare

- **Free tier** covers everything you need (CDN, DNS, SSL, DDoS protection)
- **Global edge network** — static files served from 300+ locations, so US visitors get sub-20ms response times even though the origin is in Germany
- **Only Remark42 API calls** hit the origin server directly (~100-150ms for US visitors, which is fine for comments)

## 1. Create a Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com) and sign up (free)
2. Click **Add a Site** and enter your domain (e.g., `yourdomain.com`)
3. Select the **Free** plan

## 2. Update Your Domain's Nameservers

Cloudflare will scan your existing DNS records and show you two nameservers to switch to.

1. Go to your domain registrar (wherever you bought the domain)
2. Replace the current nameservers with the two Cloudflare nameservers (e.g., `ada.ns.cloudflare.com` and `bob.ns.cloudflare.com`)
3. Save — propagation takes anywhere from a few minutes to 48 hours (usually under an hour)
4. Cloudflare will email you when the domain is active

## 3. Configure DNS Records

In Cloudflare's DNS settings, set up:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `yourdomain.com` | `your.hetzner.ip` | Proxied (orange cloud) |
| A | `remark42.yourdomain.com` | `your.hetzner.ip` | Proxied (orange cloud) |

**Proxied (orange cloud)** means traffic goes through Cloudflare's CDN. This is what you want for both the blog and Remark42.

If you also have:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `www` | `your.hetzner.ip` | Proxied (orange cloud) |

## 4. SSL/TLS Settings

Navigate to **SSL/TLS** in the Cloudflare dashboard:

1. Set encryption mode to **Full (Strict)**
   - This means: visitor → Cloudflare (HTTPS) → your origin (HTTPS)
   - Coolify/Traefik already provisions Let's Encrypt certs, so strict mode works
2. Enable **Always Use HTTPS** (under Edge Certificates)
3. Enable **Automatic HTTPS Rewrites** to fix mixed content

### Important: Coolify + Cloudflare SSL

Since both Coolify (Traefik) and Cloudflare terminate SSL, you need **Full (Strict)** mode — not **Flexible**. Flexible would cause redirect loops because Traefik expects HTTPS but Cloudflare would send HTTP to the origin.

## 5. Caching Settings

### Page Rules (free tier includes 3)

Navigate to **Rules > Page Rules** and create:

**Rule 1: Cache static assets aggressively**
- URL: `yourdomain.com/assets/*`
- Setting: Cache Level = Cache Everything
- Setting: Edge Cache TTL = 1 month
- Setting: Browser Cache TTL = 1 year

**Rule 2: Cache images**
- URL: `yourdomain.com/images/*`
- Setting: Cache Level = Cache Everything
- Setting: Edge Cache TTL = 7 days
- Setting: Browser Cache TTL = 30 days

**Rule 3: Don't cache Remark42 API**
- URL: `remark42.yourdomain.com/api/*`
- Setting: Cache Level = Bypass

### Cache Rules (alternative to Page Rules)

Cloudflare is migrating to Cache Rules. Under **Caching > Cache Rules**:

**Rule 1: Static assets**
- When: URI path starts with `/assets/`
- Then: Cache eligible, Edge TTL 30 days, Browser TTL 1 year

**Rule 2: Images**
- When: URI path starts with `/images/`
- Then: Cache eligible, Edge TTL 7 days, Browser TTL 30 days

**Rule 3: Remark42 bypass**
- When: Hostname equals `remark42.yourdomain.com` AND URI path starts with `/api/`
- Then: Bypass cache

### Default behavior

Even without explicit rules, Cloudflare automatically caches common static file types (JS, CSS, images, fonts) based on file extension. The rules above just give you more control over TTLs.

## 6. Performance Settings

Navigate to **Speed > Optimization**:

### Recommended (free tier)

- **Auto Minify**: Enable for JavaScript, CSS, HTML
- **Brotli**: Enable (better compression than gzip)
- **Early Hints**: Enable (sends `103 Early Hints` to preload assets)
- **HTTP/2**: Enabled by default
- **HTTP/3 (QUIC)**: Enable for faster connections

### Optional

- **Rocket Loader**: Try enabling — it defers JS loading for faster paint. If it breaks anything (especially Remark42 embed), disable it
- **Polish** (Pro only): Image optimization — not available on free tier
- **Mirage** (Pro only): Lazy-loading images — not available on free tier

## 7. Security Settings

### Recommended defaults

Navigate to **Security**:

- **Security Level**: Medium (default is fine)
- **Bot Fight Mode**: Enable — blocks known bad bots
- **Browser Integrity Check**: Enable
- **Challenge Passage**: 30 minutes

### Firewall rules (optional)

If you get spam comment bots hitting Remark42:

- **Rule**: Block requests to `remark42.yourdomain.com/api/*` from known bot user agents
- **Rule**: Rate limit comment submissions (under **Security > WAF > Rate Limiting Rules**)

Example rate limit (free tier gets 1 rule):
- URL: `remark42.yourdomain.com/api/v1/comment`
- Rate: 10 requests per minute per IP
- Action: Block for 10 minutes

## 8. Redirects

Under **Rules > Redirect Rules** or **Bulk Redirects**:

**www to non-www** (or vice versa):
- When: Hostname equals `www.yourdomain.com`
- Then: Dynamic redirect to `https://yourdomain.com/${http.request.uri.path}`
- Status: 301 (permanent)

## 9. Verify It's Working

### Check headers

```bash
curl -I https://yourdomain.com
```

Look for:
- `cf-cache-status: HIT` — served from Cloudflare edge (after first request)
- `cf-ray: ...` — confirms traffic is going through Cloudflare
- `server: cloudflare`

### Check a static asset

```bash
curl -I https://yourdomain.com/assets/index-abc123.js
```

Should show `cf-cache-status: HIT` on subsequent requests.

### Check Remark42 API bypass

```bash
curl -I https://remark42.yourdomain.com/api/v1/config?site=himynameisrich
```

Should show `cf-cache-status: DYNAMIC` or `BYPASS` — not HIT.

### Test from different locations

Use [tools.pingdom.com](https://tools.pingdom.com) or [gtmetrix.com](https://gtmetrix.com) to test page load times from various regions.

## 10. Purge Cache

When you deploy a new version of the site:

### Manual purge

In Cloudflare dashboard: **Caching > Configuration > Purge Everything**

### Selective purge

Purge specific URLs or paths instead of everything:
- **Caching > Configuration > Custom Purge** — enter specific URLs

### Automatic purge via API

Add this to your Coolify post-deploy hook or CI pipeline:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything": true}'
```

To get your Zone ID and API token:
1. **Zone ID**: Found on the Cloudflare dashboard overview page for your domain
2. **API Token**: Create one at **My Profile > API Tokens > Create Token** with `Zone.Cache Purge` permission

### Do you even need to purge?

Vite produces hashed filenames for JS/CSS (e.g., `index-BFPfTO3i.js`). New deploys produce new filenames, so old cached versions become irrelevant. You mainly need to purge `index.html` since that file references the new hashed assets. A targeted purge of just `/` and `/index.html` is usually sufficient.

## 11. Monitoring

### Analytics (free)

Cloudflare provides basic analytics under **Analytics & Logs**:
- Total requests, cached vs uncached
- Bandwidth saved
- Threats blocked
- Top countries, content types

### Web Analytics (free, optional)

Under **Analytics > Web Analytics**, you can add a lightweight analytics beacon (no cookies, GDPR-friendly) as an alternative to Google Analytics.

## Troubleshooting

**Redirect loops (ERR_TOO_MANY_REDIRECTS)**
- Set SSL mode to **Full (Strict)**, not Flexible
- Ensure Coolify/Traefik is serving HTTPS on the origin

**Remark42 comments not loading**
- Check that Remark42 API responses aren't being cached (should show `DYNAMIC` or `BYPASS`)
- Rocket Loader can interfere with the Remark42 embed script — try disabling it

**Stale content after deploy**
- Purge cache (see section 10) or wait for edge TTL to expire
- For immediate updates, purge just `/index.html`

**Origin server IP exposed**
- Once Cloudflare is proxying, your origin IP is hidden behind Cloudflare's IPs
- Make sure no DNS records are set to "DNS only" (gray cloud) that could leak the origin IP
- Consider Hetzner firewall rules to only allow traffic from Cloudflare's IP ranges for ports 80/443

**Cloudflare + Coolify port conflicts**
- Cloudflare only proxies ports 80 and 443 on the free tier
- Make sure Coolify/Traefik is listening on 80/443 (default)
- Internal container ports (like Remark42's 8080) are fine — Traefik handles the routing
