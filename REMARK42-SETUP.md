# Remark42 Comments Setup

This guide walks through setting up [Remark42](https://remark42.com/) as a self-hosted comment system for the blog.

## Prerequisites

- Docker and Docker Compose installed on your server
- A domain or subdomain for the Remark42 API (e.g., `remark42.yourdomain.com`)
- A reverse proxy (nginx, Caddy, etc.) with TLS configured for that domain
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

## 2. Set Up the Remark42 Server

### Directory structure

Create a directory on your server for Remark42 data:

```bash
mkdir -p /opt/remark42/data
```

### Docker Compose

Create `/opt/remark42/docker-compose.yml`:

```yaml
version: "3"

services:
  remark42:
    image: umputun/remark42:latest
    container_name: remark42
    restart: unless-stopped
    ports:
      - "8042:8080"
    environment:
      - REMARK_URL=https://remark42.yourdomain.com
      - SITE=himynameisrich
      - SECRET=CHANGE_ME_TO_A_RANDOM_STRING

      # Admin — your email to get admin access
      - ADMIN_SHARED_EMAIL=you@yourdomain.com

      # GitHub auth
      - AUTH_GITHUB_CID=your-github-client-id
      - AUTH_GITHUB_CSEC=your-github-client-secret

      # Google auth (optional — remove if not using)
      - AUTH_GOOGLE_CID=your-google-client-id
      - AUTH_GOOGLE_CSEC=your-google-client-secret

      # Anonymous comments (set to true to allow comments without login)
      - AUTH_ANON=false

      # Email notifications (optional — remove block if not using)
      - NOTIFY_TYPE=email
      - NOTIFY_EMAIL_FROM=noreply@yourdomain.com
      - SMTP_HOST=smtp.yourdomain.com
      - SMTP_PORT=587
      - SMTP_USERNAME=noreply@yourdomain.com
      - SMTP_PASSWORD=your-smtp-password
      - SMTP_TLS=true

      # Moderation
      - ADMIN_SHARED_ID=github_YOUR_GITHUB_USER_ID
      - LOW_SCORE=-5
      - CRITICAL_SCORE=-10
      - POSITIVE_SCORE=false
      - RESTRICTED_WORDS=spam,viagra,casino
      - MAX_COMMENT_SIZE=2048

    volumes:
      - /opt/remark42/data:/srv/var
```

### Generate a secret

```bash
openssl rand -base64 32
```

Use the output as your `SECRET` value.

### Start the server

```bash
cd /opt/remark42
docker compose up -d
```

Verify it's running:

```bash
docker compose logs -f remark42
```

You should see `listening on 0.0.0.0:8080` in the logs.

## 3. Configure Reverse Proxy

Remark42 needs to be accessible via HTTPS. Here are configs for common reverse proxies.

### Caddy (simplest)

```
remark42.yourdomain.com {
    reverse_proxy localhost:8042
}
```

### nginx

```nginx
server {
    listen 443 ssl http2;
    server_name remark42.yourdomain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8042;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### CORS

Remark42 handles CORS internally — no additional CORS headers needed in your reverse proxy. Just make sure the `REMARK_URL` env var matches the public URL exactly.

## 4. Connect the Blog

### Set the environment variable

Create or edit `.env` in the blog project root:

```
VITE_REMARK42_HOST=https://remark42.yourdomain.com
```

For production builds, set this in your build environment / CI:

```bash
VITE_REMARK42_HOST=https://remark42.yourdomain.com npm run build
```

### How it works

The `Comments` component (`src/components/Comments.tsx`) handles everything:

- Reads `VITE_REMARK42_HOST` from the environment at build time
- If the variable is empty (local dev), shows a placeholder message instead
- If set, loads the Remark42 embed script and renders the comment widget
- Each post's slug is used as the unique page ID
- The `site_id` is set to `himynameisrich` (must match the `SITE` env var on the server)
- Comments are cleaned up on page navigation to prevent stale state

## 5. Admin Access

### Finding your admin ID

After logging in to Remark42 via your blog for the first time, find your user ID:

```bash
docker exec remark42 remark42 admin --site=himynameisrich --list
```

Update `ADMIN_SHARED_ID` in your docker-compose.yml with the ID (e.g., `github_abc123`), then restart:

```bash
docker compose restart remark42
```

### Admin panel

Once configured as admin, you'll see moderation controls directly in the comment widget on your blog. You can also access the admin API at:

```
https://remark42.yourdomain.com/api/v1/admin
```

### What admins can do

- Delete or pin any comment
- Block users (by user ID or IP)
- Enable pre-moderation (all comments require approval)
- View flagged/reported comments
- Export/import comment data
- Access comment RSS feeds

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

To require approval for all comments, add:

```
- ADMIN_SHARED_ID=github_YOUR_ID
```

Then use the admin API to enable moderation:

```bash
curl -X PUT "https://remark42.yourdomain.com/api/v1/admin/wait?site=himynameisrich&mode=1" \
  -H "Content-Type: application/json"
```

## 7. Backup & Restore

### Manual backup

```bash
docker exec remark42 remark42 backup --site=himynameisrich --path=/srv/var
```

The backup file is saved to `/opt/remark42/data/` on the host.

### Automated backups

Add to your crontab:

```bash
0 3 * * * docker exec remark42 remark42 backup --site=himynameisrich --path=/srv/var
```

### Restore from backup

```bash
docker exec remark42 remark42 restore --site=himynameisrich --path=/srv/var --file=backup-himynameisrich-YYYYMMDD.gz
```

## 8. Troubleshooting

**Comments widget not loading**
- Check browser console for CORS or network errors
- Verify `VITE_REMARK42_HOST` matches `REMARK_URL` exactly (including https://)
- Ensure the Remark42 container is running: `docker compose ps`

**Auth callback fails**
- Verify the callback URL in your OAuth app matches `REMARK_URL` + `/auth/{provider}/callback`
- Check Remark42 logs: `docker compose logs remark42 | grep auth`

**"Site not found" error**
- Ensure `SITE=himynameisrich` in docker-compose matches `site_id` in `Comments.tsx`

**Comments not showing after page navigation**
- The component handles cleanup/reinit automatically via React effects — if you see stale comments, hard-refresh the page

**Disk space**
- Remark42 uses BoltDB (single file). Typical usage is very small (< 100MB for thousands of comments)
- Avatars are cached in `/srv/var/avatars/` — this directory can grow; clean periodically if needed
