# Remark42 Comments Setup

This guide walks through setting up [Remark42](https://remark42.com/) as a self-hosted comment system for the blog, deployed via [Coolify](https://coolify.io/) on a Hetzner ARM64 VPS.

## Prerequisites

- A Hetzner VPS with Coolify installed (see [HETZNER-SERVER-SETUP.md](./HETZNER-SERVER-SETUP.md))
- A domain pointed to your server (e.g., `himynameisrich.com`)
- A subdomain for Remark42 (e.g., `remark42.himynameisrich.com`)
- At least one OAuth app for authentication (GitHub, Google, etc.)
- The blog frontend already deployed (see [COOLIFY-DEPLOYMENT.md](./COOLIFY-DEPLOYMENT.md))

## Architecture Overview

```
GitHub repo                        GitHub Actions                  Hetzner/Coolify
───────────                        ──────────────                  ───────────────
remark42/Dockerfile    ──push──▶   Build multi-arch image   ──▶   ghcr.io/richmosko/remark42-custom
remark42/web/custom.css             (amd64 + arm64)
                                                                   ▼
                                                            Docker Compose pulls image
                                                                   ▼
                                                            remark42.himynameisrich.com:8080
```

The custom Docker image extends the official Remark42 image by appending CSS overrides to match the blog's design. It's built by GitHub Actions and hosted on GitHub Container Registry (GHCR).

## 1. Create OAuth App(s)

You need at least one auth provider so visitors can log in to comment.

### Google OAuth

1. Go to **Google Cloud Console > APIs & Services > Credentials > Create OAuth Client ID**
2. Set **Authorized redirect URI** to exactly:
   ```
   https://remark42.himynameisrich.com/auth/google/callback
   ```
3. Save the **Client ID** and **Client Secret**

**Common gotcha:** If you see "Access blocked: This app's request is invalid" when trying to sign in, the redirect URI doesn't match exactly. Check for:
- `https` not `http`
- Exact subdomain (`remark42.himynameisrich.com`)
- Exact path (`/auth/google/callback`)
- No trailing slash

### GitHub OAuth

1. Go to **GitHub > Settings > Developer settings > OAuth Apps > New OAuth App**
2. Fill in:
   - **Application name**: `HiMyNameIsRich Comments`
   - **Homepage URL**: `https://himynameisrich.com`
   - **Authorization callback URL**: `https://remark42.himynameisrich.com/auth/github/callback`
3. Save the **Client ID** and **Client Secret**

## 2. Build the Custom Docker Image

The custom image is built automatically by GitHub Actions and published to GHCR.

### How the image build works

The GitHub Action (`.github/workflows/remark42-image.yml`):
- Triggers on every push to `main` and on manual dispatch
- Uses QEMU + Docker Buildx for cross-platform builds
- Builds for **both `linux/amd64` and `linux/arm64`** (critical for Hetzner ARM servers)
- Pushes to `ghcr.io/richmosko/remark42-custom:v1.15.0` and `:latest`

**Important — ARM64:** If you only build for `amd64`, the container will fail on Hetzner ARM servers with `exec /init.sh: exec format error`. The workflow is configured to build for both architectures.

### First-time setup

1. Merge the workflow file to `main` (it should already be there)
2. Go to **GitHub > Actions > Build Remark42 Custom Image**
3. Click **Run workflow** > select **main** > click the green **Run workflow** button
4. Wait for it to complete (~2-3 minutes)
5. Verify the image exists at: `github.com/richmosko/hi-my-name-is-rich/pkgs/container/remark42-custom`

### Make the package accessible

By default, GHCR packages are **private**. Coolify needs to pull the image, so either:

**Option A: Make it public (simpler)**
1. Go to `github.com/richmosko/hi-my-name-is-rich/pkgs/container/remark42-custom`
2. Click **Package settings** (right sidebar)
3. Scroll to **Danger Zone** > **Change visibility** > **Public**

**Option B: Keep it private**
- Configure Coolify with a GitHub personal access token that has `read:packages` scope

### Updating styles later

1. Edit `remark42/web/custom.css` in the repo
2. Commit and push to `main`
3. GitHub Action rebuilds the image automatically
4. Redeploy the Remark42 service in Coolify
5. **Hard-refresh** the browser (Cmd+Shift+R) — the Remark42 iframe caches CSS aggressively

## 3. Deploy Remark42 via Coolify

### Create the Docker Compose resource

1. In Coolify, go to **Projects > your project > Add Resource > Docker Compose**
2. Paste the following `docker-compose.yml`:

```yaml
services:
  remark42:
    image: ghcr.io/richmosko/remark42-custom:v1.15.0
    container_name: remark42
    restart: unless-stopped
    environment:
      - REMARK_URL=https://remark42.himynameisrich.com
      - SITE=himynameisrich
      - SECRET=${REMARK42_SECRET}
      - ADMIN_SHARED_EMAIL=${ADMIN_EMAIL}
      - AUTH_GITHUB_CID=${GITHUB_CLIENT_ID}
      - AUTH_GITHUB_CSEC=${GITHUB_CLIENT_SECRET}
      - AUTH_GOOGLE_CID=${GOOGLE_CLIENT_ID}
      - AUTH_GOOGLE_CSEC=${GOOGLE_CLIENT_SECRET}
      - AUTH_ANON=false
      - ADMIN_SHARED_ID=${ADMIN_SHARED_ID}
      - LOW_SCORE=-5
      - CRITICAL_SCORE=-10
      - POSITIVE_SCORE=false
      - RESTRICTED_WORDS=spam,viagra,casino
      - MAX_COMMENT_SIZE=2048
    volumes:
      - remark42-data:/srv/var

volumes:
  remark42-data:
```

### Set environment variables

In Coolify's **Environment Variables** section for this service, add:

| Variable | Value |
|----------|-------|
| `REMARK42_SECRET` | Generate with `openssl rand -base64 32` |
| `ADMIN_EMAIL` | `admin@himynameisrich.com` |
| `GITHUB_CLIENT_ID` | From step 1 |
| `GITHUB_CLIENT_SECRET` | From step 1 |
| `GOOGLE_CLIENT_ID` | From step 1 |
| `GOOGLE_CLIENT_SECRET` | From step 1 |
| `ADMIN_SHARED_ID` | Set after first login — see step 4 |

### Configure networking

In the **Network** section:
- **Port**: `8080`
- **Domain**: `remark42.himynameisrich.com`
- Coolify's Traefik handles SSL automatically

### Deploy

Click **Deploy** and watch the logs. Common issues:

| Error | Cause | Fix |
|-------|-------|-----|
| `exec /init.sh: exec format error` | Image built for wrong architecture | Ensure the GitHub Action builds for `linux/arm64` |
| `Degraded (unhealthy)` | Health check failing or missing env vars | Check container logs in Coolify |
| Image pull fails | GHCR package is private | Make the package public (step 2) or add a pull token |

### Verify Remark42 is running

Visit this URL — you should get a JSON response:

```
https://remark42.himynameisrich.com/api/v1/config?site=himynameisrich
```

**Note:** The root URL (`https://remark42.himynameisrich.com`) shows a 404 — this is normal. Remark42 is an API server, not a website.

## 4. Deploy the Blog Frontend with Comments

The blog frontend needs the `VITE_REMARK42_HOST` build variable to connect to Remark42.

1. In Coolify, go to your blog frontend resource > **Environment Variables**
2. Add: `VITE_REMARK42_HOST` = `https://remark42.himynameisrich.com`
   - **Must be a Build variable** (not just Runtime) — Vite inlines it at build time
3. Redeploy the blog frontend

The Comments component (`src/components/Comments.tsx`) will now load the Remark42 widget at the bottom of every post.

## 5. Admin Access

### Finding your admin ID

1. Visit any post on your live site and scroll to the comments
2. Log in via Google or GitHub and leave a test comment
3. Open browser dev tools (**Cmd+Option+I** on Mac)
4. Go to the **Network** tab
5. Refresh the page
6. Filter requests by `remark42` — click on a `find?site=...` request
7. In the **Response** tab, look for your user ID in the JSON: `comments[0].user.id`
   - It looks like `google_abc123def456` or `github_abc123`
8. Copy your user ID

**Note:** Coolify assigns container names like `remark42-z34c100av9duqzocw4jfrnoq` instead of `remark42`. The `docker exec remark42 remark42 admin` command from the Remark42 docs won't work. Use the browser dev tools approach above instead.

### Set yourself as admin

1. In Coolify, go to the Remark42 resource > **Environment Variables**
2. Set `ADMIN_SHARED_ID` to your user ID (e.g., `google_dcf9117971a6c8f6df9a86ac46db3cac2b1e4b87`)
3. Redeploy the Remark42 service

### Admin controls

Once configured as admin, you'll see extra controls in the comment widget:

- **Pin/unpin** — stick a comment to the top
- **Delete** — remove any comment
- **Block user** — ban a user from commenting
- **Verify user** — mark as trusted (shows checkmark)
- **Admin badge** next to your name on your own comments
- **Gear icon** in widget header for read-only mode and pre-moderation

There is no separate admin dashboard — everything is inline in the comment widget.

## 6. Moderation Settings

These environment variables control moderation behavior:

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_ANON` | `false` | Allow anonymous comments (no login required) |
| `LOW_SCORE` | `-5` | Score threshold to collapse a comment |
| `CRITICAL_SCORE` | `-10` | Score threshold to hide a comment entirely |
| `RESTRICTED_WORDS` | `` | Comma-separated list of words that flag a comment |
| `MAX_COMMENT_SIZE` | `2048` | Maximum comment length in characters |
| `ADMIN_EDIT` | `true` | Allow admins to edit any comment |
| `POSITIVE_SCORE` | `false` | Show positive vote counts publicly |

### Pre-moderation mode

To require approval for all comments:

```bash
curl -X PUT "https://remark42.himynameisrich.com/api/v1/admin/wait?site=himynameisrich&mode=1" \
  -H "Content-Type: application/json"
```

## 7. Backup & Restore

### Manual backup

Find the actual container name first:

```bash
docker ps --filter "ancestor=ghcr.io/richmosko/remark42-custom:v1.15.0" --format '{{.Names}}'
```

Then run the backup:

```bash
docker exec CONTAINER_NAME remark42 backup --site=himynameisrich --path=/srv/var
```

Or use a one-liner:

```bash
docker exec $(docker ps -qf "ancestor=ghcr.io/richmosko/remark42-custom") remark42 backup --site=himynameisrich --path=/srv/var
```

### Automated backups

Add a cron job on the host server (`crontab -e`):

```bash
0 3 * * * docker exec $(docker ps -qf "ancestor=ghcr.io/richmosko/remark42-custom") remark42 backup --site=himynameisrich --path=/srv/var
```

Consider copying backups off-server (e.g., to S3 or rsync to another machine).

### Restore from backup

```bash
docker exec CONTAINER_NAME remark42 restore --site=himynameisrich --path=/srv/var --file=backup-himynameisrich-YYYYMMDD.gz
```

## 8. DNS Setup

Point these DNS records to your Hetzner server's IP:

| Type | Name | Value |
|------|------|-------|
| A | `himynameisrich.com` | `your.server.ip` |
| A | `remark42.himynameisrich.com` | `your.server.ip` |

Coolify's Traefik proxy routes traffic to the correct container based on the domain and provisions Let's Encrypt certificates automatically.

## 9. Custom Styling

Remark42 renders in an iframe, so your site's CSS can't reach it directly. We build a custom Docker image that appends CSS overrides to Remark42's built-in stylesheet.

### How it works

```
remark42/
  Dockerfile      # FROM umputun/remark42:v1.15.0, appends custom.css to remark.css
  web/
    custom.css    # CSS variable overrides + selector overrides
```

The Dockerfile:
```dockerfile
FROM umputun/remark42:v1.15.0
COPY web/custom.css /tmp/custom.css
RUN cat /tmp/custom.css >> /srv/web/remark.css && rm /tmp/custom.css
```

### What's customized

The custom CSS overrides both CSS custom properties (`--primary-color`, etc.) and Remark42's internal color variables (`--color9`, `--color15`, etc.) which are used as hardcoded fallbacks throughout the stylesheet.

| Property | Default (Remark42) | Override (Blog) |
|----------|-------------------|-----------------|
| Accent color | Teal `#0aa` | Blue `#4a6cf7` |
| Hover accent | `#099` | `#3451d1` |
| Text color | `#333` | `#444444` |
| Secondary text | `#64748b` | `#555555` |
| Muted text | `#969696` | `#999999` |
| Borders | `#e2e8f0` | `#e5e5e5` |
| Input background | White | `#f5f5f5` |
| Selection color | Teal tint | Blue tint |
| Focus rings | Teal glow | Blue glow |
| Font stack | System default | Matches site's system font stack |
| Button radius | Square | 6px rounded |

### Frontend config options

In addition to the CSS overrides, the `Comments.tsx` component sets:

| Option | Value | Effect |
|--------|-------|--------|
| `theme` | `light` | Light background theme |
| `no_footer` | `true` | Hides "Remark42" branding footer |
| `show_rss_subscription` | `false` | Hides RSS icon |
| `show_email_subscription` | `false` | Hides email subscription |
| `primary_color` | `#4a6cf7` | Sets accent color (partial — CSS overrides cover the rest) |

### Modifying styles

1. Edit `remark42/web/custom.css` in the repo
2. Commit and push to `main`
3. GitHub Action rebuilds the image automatically (~2 min)
4. Redeploy the Remark42 service in Coolify
5. **Hard-refresh** the browser (**Cmd+Shift+R**) — the iframe caches CSS aggressively
6. If styles still look old, try an **incognito window** to confirm the change took effect

### Finding CSS class names

Remark42 uses minified class names (e.g., `.C_A` for the submit button). To inspect:

```bash
curl -s https://remark42.himynameisrich.com/web/remark.css | tr '}' '\n' | grep 'button\|submit\|color9'
```

### Important notes

- **Pin the image version** (`v1.15.0`) in the Dockerfile — a major update could restructure the CSS
- **Same-origin limitation**: You cannot inject CSS into the iframe via JavaScript because Remark42 runs on a different subdomain
- The `primary_color` frontend config only partially works — it changes some accent colors but not buttons or links that use hardcoded color variables

## 10. Troubleshooting

**Comments widget not loading**
- Check browser console for CORS or network errors
- Verify `VITE_REMARK42_HOST` matches `REMARK_URL` exactly (including `https://`)
- Ensure the Remark42 container is running in Coolify's dashboard

**"Access blocked: This app's request is invalid" on OAuth login**
- The redirect URI in your OAuth app doesn't match exactly
- Must be: `https://remark42.himynameisrich.com/auth/{provider}/callback`
- Check for `https`, exact subdomain, exact path, no trailing slash

**`exec /init.sh: exec format error`**
- Architecture mismatch — the image was built for `amd64` but the server is `arm64`
- Ensure the GitHub Action includes `platforms: linux/amd64,linux/arm64`
- Re-run the workflow and redeploy

**Container name is randomized (e.g., `remark42-z34c100...`)**
- Coolify overrides `container_name` with its own ID
- Use `docker ps -qf "ancestor=ghcr.io/richmosko/remark42-custom"` to find the container
- Or create a shell alias on the server

**Styles not updating after redeploy**
- The Remark42 iframe caches CSS aggressively
- Hard-refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)
- Test in an **incognito window** to confirm the change actually took effect
- If still stale, clear browser cache entirely

**Root URL returns 404**
- This is normal — Remark42 is an API server with no landing page
- Verify it's running: `https://remark42.himynameisrich.com/api/v1/config?site=himynameisrich`

**`SITE` mismatch**
- `SITE=himynameisrich` in docker-compose must match `site_id: 'himynameisrich'` in `Comments.tsx`

**Webhook not triggering Coolify redeploy**
- Check GitHub repo > **Settings > Webhooks** — is there a webhook listed?
- If missing, copy the webhook URL from Coolify (must include the auth token)
- Check **Recent Deliveries** — a 401 means the token is missing from the URL
- The Coolify webhook URL format: `https://coolify.himynameisrich.com/api/v1/deploy?uuid=...&token=YOUR_API_TOKEN`
- Generate an API token in Coolify under **Security** or **API**
