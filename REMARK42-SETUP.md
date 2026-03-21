# Remark42 Comments Setup

This guide walks through setting up [Remark42](https://remark42.com/) as a self-hosted comment system for the blog, deployed via [Coolify](https://coolify.io/) on a Hetzner VPS.

## Server Requirements

A Hetzner CPX11 (2 shared vCPU / 2 GB RAM / 40 GB SSD) is sufficient to run Coolify + the blog + Remark42. Typical idle usage is ~1 GB RAM total.

**Recommended:** Enable 1-2 GB swap as a safety net for Docker image builds:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## Prerequisites

- A Hetzner VPS (or similar) with Coolify installed
- A domain pointed to your server (e.g., `yourdomain.com`)
- A subdomain for Remark42 (e.g., `remark42.yourdomain.com`)
- At least one OAuth app for authentication (GitHub, Google, etc.)

## 1. Create OAuth App(s)

You need at least one auth provider so visitors can log in to comment. GitHub is the easiest to start with.

### GitHub OAuth

1. Go to **GitHub > Settings > Developer settings > OAuth Apps > New OAuth App**
2. Fill in:
   - **Application name**: `HiMyNameIsRich Comments`
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**: `https://remark42.yourdomain.com/auth/github/callback`
3. Save the **Client ID** and **Client Secret**

### Google OAuth (optional)

1. Go to **Google Cloud Console > APIs & Services > Credentials > Create OAuth Client ID**
2. Set **Authorized redirect URI** to: `https://remark42.yourdomain.com/auth/google/callback`
3. Save the **Client ID** and **Client Secret**

## 2. Deploy Remark42 via Coolify

### Option A: Docker Compose service in Coolify

#### Custom image via GitHub Container Registry

The custom Remark42 image (with CSS overrides) is built automatically by GitHub Actions whenever `remark42/` changes in the repo. The image is published to:

```
ghcr.io/richmosko/remark42-custom:v1.15.0
```

The GitHub Action (`.github/workflows/remark42-image.yml`) triggers on:
- Push to `main` that changes any file in `remark42/`
- Manual trigger via the Actions tab (`workflow_dispatch`)

**First-time setup:** After merging the workflow to `main`, go to **GitHub > Actions** and run the "Build Remark42 Custom Image" workflow manually to build the initial image. Then verify it at `github.com/richmosko/hi-my-name-is-rich/pkgs/container/remark42-custom`.

**Updating styles:** Edit `remark42/web/custom.css`, commit, push to `main` — the image rebuilds automatically. Then redeploy the Remark42 service in Coolify.

#### Make the package accessible to Coolify

By default, GHCR packages are private. You need to make it accessible:

1. Go to `github.com/richmosko/hi-my-name-is-rich/pkgs/container/remark42-custom`
2. Click **Package settings** (right sidebar)
3. Under **Danger Zone**, change visibility to **Public**
   - Or: keep it private and configure Coolify with a GitHub personal access token that has `read:packages` scope

#### Create the Coolify resource

1. In Coolify, go to **Projects > your project > Add Resource > Docker Compose**
2. Paste the following `docker-compose.yml`:

```yaml
services:
  remark42:
    # Custom image with CSS overrides — built by GitHub Actions, hosted on GHCR
    image: ghcr.io/richmosko/remark42-custom:v1.15.0
    # To use stock image instead: image: umputun/remark42:v1.15.0
    container_name: remark42
    restart: unless-stopped
    environment:
      - REMARK_URL=https://remark42.yourdomain.com
      - SITE=himynameisrich
      - SECRET=${REMARK42_SECRET}

      # Admin
      - ADMIN_SHARED_EMAIL=${ADMIN_EMAIL}

      # GitHub auth
      - AUTH_GITHUB_CID=${GITHUB_CLIENT_ID}
      - AUTH_GITHUB_CSEC=${GITHUB_CLIENT_SECRET}

      # Google auth (optional — remove if not using)
      - AUTH_GOOGLE_CID=${GOOGLE_CLIENT_ID}
      - AUTH_GOOGLE_CSEC=${GOOGLE_CLIENT_SECRET}

      # Anonymous comments
      - AUTH_ANON=false

      # Email notifications (optional — remove block if not using)
      - NOTIFY_TYPE=email
      - NOTIFY_EMAIL_FROM=noreply@yourdomain.com
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=587
      - SMTP_USERNAME=${SMTP_USERNAME}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - SMTP_TLS=true

      # Moderation
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

3. In Coolify's **Environment Variables** section for this service, add:

| Variable | Value |
|----------|-------|
| `REMARK42_SECRET` | (generate with `openssl rand -base64 32`) |
| `ADMIN_EMAIL` | `you@yourdomain.com` |
| `GITHUB_CLIENT_ID` | (from step 1) |
| `GITHUB_CLIENT_SECRET` | (from step 1) |
| `GOOGLE_CLIENT_ID` | (optional) |
| `GOOGLE_CLIENT_SECRET` | (optional) |
| `SMTP_HOST` | (your SMTP server) |
| `SMTP_USERNAME` | (your SMTP user) |
| `SMTP_PASSWORD` | (your SMTP password) |
| `ADMIN_SHARED_ID` | (set after first login — see step 4) |

4. Under **Network**, set:
   - **Port**: `8080`
   - **Domain**: `remark42.yourdomain.com`
   - Coolify's Traefik will handle SSL automatically

5. Click **Deploy**

### Option B: Standalone Docker service in Coolify

1. Go to **Projects > your project > Add Resource > Docker Image**
2. Set image to `umputun/remark42:latest`
3. Set port to `8080`
4. Set domain to `remark42.yourdomain.com`
5. Add the same environment variables from Option A directly (without the `${}` wrapper)
6. Add a persistent volume: `/srv/var` mapped to a named volume
7. Deploy

## 3. Deploy the Blog via Coolify

### Using a Dockerfile

1. In Coolify, add a new resource: **GitHub Repository** (connect your `hi-my-name-is-rich` repo)
2. Coolify will detect the build method. For a static site, create a `Dockerfile` in the repo root if you don't have one:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_REMARK42_HOST
ENV VITE_REMARK42_HOST=$VITE_REMARK42_HOST
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

3. Create `nginx.conf` in the repo root:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback — all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Cache images
    location /images/ {
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

4. In Coolify, set:
   - **Domain**: `yourdomain.com`
   - **Port**: `80`
   - **Build variable**: `VITE_REMARK42_HOST=https://remark42.yourdomain.com`

5. Deploy — Coolify handles SSL via Traefik automatically

### Using Nixpacks (alternative)

Coolify can auto-detect Node.js projects via Nixpacks. It will run `npm run build` and serve the `dist/` folder. Add the `VITE_REMARK42_HOST` build variable in the Coolify UI.

## 4. Admin Access

### Finding your admin ID

After deploying Remark42, visit your blog and leave a test comment (log in via GitHub). Then find your user ID:

1. In Coolify, open the Remark42 service terminal (or SSH into the server)
2. Run:

```bash
docker exec remark42 remark42 admin --site=himynameisrich --list
```

3. Copy your user ID (e.g., `github_abc123`)
4. Update the `ADMIN_SHARED_ID` environment variable in Coolify
5. Redeploy the Remark42 service

### Admin panel

Once configured as admin, you'll see moderation controls directly in the comment widget on your blog.

### What admins can do

- Delete or pin any comment
- Block users (by user ID or IP)
- Enable pre-moderation (all comments require approval)
- View flagged/reported comments
- Export/import comment data
- Access comment RSS feeds

## 5. Moderation Settings

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
curl -X PUT "https://remark42.yourdomain.com/api/v1/admin/wait?site=himynameisrich&mode=1" \
  -H "Content-Type: application/json"
```

## 6. Backup & Restore

### Manual backup

In Coolify's terminal for the Remark42 service (or via SSH):

```bash
docker exec remark42 remark42 backup --site=himynameisrich --path=/srv/var
```

The backup file is saved inside the persistent volume.

### Automated backups

Add a cron job on the host server:

```bash
0 3 * * * docker exec remark42 remark42 backup --site=himynameisrich --path=/srv/var
```

**Tip:** Coolify doesn't have built-in cron, so set this up directly on the host via `crontab -e`. Consider also copying backups off-server (e.g., to S3 or rsync to another machine).

### Restore from backup

```bash
docker exec remark42 remark42 restore --site=himynameisrich --path=/srv/var --file=backup-himynameisrich-YYYYMMDD.gz
```

## 7. DNS Setup

Point these DNS records to your Hetzner server's IP:

| Type | Name | Value |
|------|------|-------|
| A | `yourdomain.com` | `your.server.ip` |
| A | `remark42.yourdomain.com` | `your.server.ip` |

Coolify's Traefik proxy routes traffic to the correct container based on the domain and provisions Let's Encrypt certificates automatically.

## 8. Troubleshooting

**Comments widget not loading**
- Check browser console for CORS or network errors
- Verify `VITE_REMARK42_HOST` matches `REMARK_URL` exactly (including https://)
- Ensure the Remark42 container is running in Coolify's dashboard

**Auth callback fails**
- Verify the callback URL in your OAuth app matches `REMARK_URL` + `/auth/{provider}/callback`
- Check Remark42 logs in Coolify's log viewer

**"Site not found" error**
- Ensure `SITE=himynameisrich` in Remark42 config matches `site_id` in `Comments.tsx`

**Comments not showing after page navigation**
- The component handles cleanup/reinit automatically via React effects — if you see stale comments, hard-refresh the page

**Disk space**
- Remark42 uses BoltDB (single file). Typical usage is very small (< 100MB for thousands of comments)
- Avatars are cached in `/srv/var/avatars/` — this directory can grow; clean periodically if needed

**Coolify build fails**
- Check that `VITE_REMARK42_HOST` is set as a **build** variable (not just runtime) since Vite inlines it at build time
- Ensure the Dockerfile is in the repo root

## 9. Custom Styling

Remark42 renders in an iframe, so your site's CSS can't reach it. The `primary_color` config option changes the accent color, but for deeper customization we build a custom Docker image.

### How it works

```
remark42/
  Dockerfile      # Extends official image, appends custom CSS
  web/
    custom.css    # CSS overrides matching the blog's design tokens
```

The Dockerfile appends `custom.css` to the built-in `remark.css` inside the container. This overrides CSS custom properties and specific selectors.

### What's customized

| Property | Default (Remark42) | Override (Blog) |
|----------|-------------------|-----------------|
| Accent color | Teal `#0aa` | Blue `#4a6cf7` |
| Text color | `#333` | `#444444` |
| Secondary text | `#64748b` | `#555555` |
| Muted text | `#969696` | `#999999` |
| Borders | `#e2e8f0` | `#e5e5e5` |
| Input background | White | `#f5f5f5` |
| Font stack | System default | Matches site's system font stack |
| Button radius | Square | 6px rounded |

### Modifying styles

1. Edit `remark42/web/custom.css`
2. Rebuild and redeploy the Remark42 container in Coolify
3. Hard-refresh the browser to see changes (iframe CSS may be cached)

### Finding CSS class names

To inspect Remark42's CSS classes, fetch the live stylesheet:

```bash
curl https://remark42.himynameisrich.com/web/remark.css | head -100
```

**Important:** Pin the Remark42 image version (`v1.15.0`) in the Dockerfile. A major version update could restructure the CSS and break overrides.
