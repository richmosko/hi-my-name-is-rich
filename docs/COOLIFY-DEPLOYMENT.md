# Coolify Deployment Guide

This guide covers deploying the blog frontend to Coolify with continuous deployment from GitHub. After completing this guide, every push to `main` will automatically build and deploy the site.

## Prerequisites

- A Hetzner VPS with Coolify installed (see [HETZNER-SERVER-SETUP.md](./HETZNER-SERVER-SETUP.md))
- A domain pointed to your server
- The GitHub repo (`richmosko/hi-my-name-is-rich`)
- Coolify dashboard accessible at `http://YOUR_SERVER_IP:8000`

## Architecture Overview

```
GitHub push to main
        │
        ▼
Coolify webhook receives push event
        │
        ▼
Coolify pulls latest code from GitHub
        │
        ▼
Docker multi-stage build:
  1. node:22-alpine → npm ci + npm run build
  2. nginx:alpine → serves /dist as static files
        │
        ▼
Traefik routes yourdomain.com → nginx container (port 80)
Traefik auto-provisions Let's Encrypt SSL
```

## Files in the Repo

This guide relies on three files already in the repo root:

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build: Node for building, nginx for serving |
| `nginx.conf` | SPA routing, asset caching, gzip compression |
| `.dockerignore` | Excludes node_modules, .git, etc. from Docker context |

## 1. Connect GitHub to Coolify

### Add a GitHub App (recommended over deploy keys)

1. In the Coolify dashboard, go to **Sources** (left sidebar)
2. Click **Add** > **GitHub App**
3. Click **Register a GitHub App** — this redirects to GitHub
4. On GitHub, name the app (e.g., `coolify-blog-deploy`) and click **Create GitHub App**
5. GitHub redirects back to Coolify with the app credentials filled in
6. Click **Install Repositories** — this redirects to GitHub again
7. Select **Only select repositories** > choose `richmosko/hi-my-name-is-rich`
8. Click **Install**
9. Back in Coolify, verify the source shows as **Connected**

This grants Coolify read access to your repo and sets up a webhook for push events.

### Alternative: Deploy Key (simpler, less features)

If you prefer not to create a GitHub App:

1. In Coolify, go to **Security > Private Keys**
2. Click **Add** > generate a new key pair
3. Copy the **public key**
4. In GitHub, go to your repo > **Settings > Deploy keys > Add deploy key**
5. Paste the public key, name it `coolify`, check **Allow write access** (not needed, but won't hurt)
6. Save

## 2. Create the Blog Resource in Coolify

1. Go to **Projects** in Coolify
2. Click **Add** to create a new project (e.g., `Personal Blog`) — or use an existing one
3. Click into the project, then click **Add Resource**
4. Select **Public Repository** (if using deploy key) or **Private Repository (GitHub App)** (if using GitHub App)
5. Select the `richmosko/hi-my-name-is-rich` repository
6. Branch: `main`
7. Coolify will auto-detect the Dockerfile

### Configure Build Settings

8. In the resource settings, go to the **Build** section:
   - **Build Pack**: Docker
   - **Dockerfile Location**: `/Dockerfile` (should be auto-detected)
   - **Port**: `80`

### Configure Environment Variables

9. Go to the **Environment Variables** section and add:

   | Variable | Value | Build / Runtime |
   |----------|-------|-----------------|
   | `VITE_REMARK42_HOST` | `https://remark42.yourdomain.com` | **Build** |

   **Important:** `VITE_REMARK42_HOST` must be set as a **Build** variable (not Runtime) because Vite inlines environment variables at build time. A runtime-only variable won't be available in the built JavaScript.

### Configure Domain

10. Go to the **Network** section:
    - **Domain**: `yourdomain.com`
    - **Port**: `80`
    - **HTTPS**: Enabled (Coolify provisions Let's Encrypt certificates automatically via Traefik)

    To also serve on `www`:
    - Add a second domain: `www.yourdomain.com`

### Health Check (optional)

11. In **Health Check** settings:
    - **Path**: `/`
    - **Port**: `80`
    - This lets Coolify verify the container is healthy after deployment

## 3. Initial Deployment

1. Click **Deploy** in the Coolify dashboard
2. Watch the build logs — you should see:
   - Docker pulling `node:22-alpine`
   - `npm ci` installing dependencies
   - `npm run build` (TypeScript check + Vite build)
   - Docker pulling `nginx:alpine`
   - Container starting on port 80
3. Once the deployment finishes, verify the site loads at `https://yourdomain.com`

### Troubleshooting First Deploy

**Build fails at `npm ci`**
- Check that `package-lock.json` is committed to the repo
- Verify the Dockerfile is in the repo root

**Build fails at `npm run build`**
- Usually a TypeScript or lint error — run `npm run build` locally to reproduce
- Check that all source files are committed

**Site loads but shows nginx 404**
- Verify `nginx.conf` is in the repo root
- Check the Dockerfile copies it to the right location

**Site loads but routes return 404**
- The `try_files $uri $uri/ /index.html` in nginx.conf handles SPA routing
- Make sure you're using the `nginx.conf` from the repo, not nginx's default

**HTTPS not working**
- Coolify needs ports 80 and 443 open on the server
- DNS must be pointing to the server for Let's Encrypt to issue a certificate
- Check Traefik logs in Coolify for certificate errors

## 4. Set Up Continuous Deployment

### Using GitHub App (automatic)

If you connected via GitHub App in step 1, CD is already set up. The webhook fires on every push. Just verify:

1. In Coolify, go to your blog resource > **Webhooks** tab
2. Confirm the webhook is active and listening for push events
3. The **Auto Deploy** toggle should be enabled

### Using Deploy Key (manual webhook setup)

If you used a deploy key instead of a GitHub App:

1. In Coolify, go to your blog resource > **Webhooks** tab
2. Copy the **Webhook URL** (looks like `https://YOUR_SERVER_IP:8000/api/v1/deploy?...`)
3. In GitHub, go to your repo > **Settings > Webhooks > Add webhook**
4. **Payload URL**: paste the Coolify webhook URL
5. **Content type**: `application/json`
6. **Secret**: leave blank (Coolify uses token auth in the URL)
7. **Events**: select **Just the push event**
8. Click **Add webhook**

### Test CD

1. Make a small change locally (e.g., edit a post)
2. Commit and push to `main`:
   ```bash
   git push origin main
   ```
3. In Coolify, go to **Deployments** — you should see a new deployment triggered automatically
4. Once it finishes, verify the change is live on your site

## 5. GitHub Actions CI + Coolify CD Pipeline

Your existing CI workflow (`.github/workflows/ci.yml`) runs lint and build on every push and PR. Combined with Coolify's webhook, the pipeline is:

```
Developer pushes to main (or merges PR)
        │
        ├──▶ GitHub Actions: lint + type-check + build (CI)
        │
        └──▶ Coolify webhook: pull + Docker build + deploy (CD)
```

Both run in parallel. If you want to gate deployments on CI passing, you can add a deployment workflow that only triggers after CI succeeds:

### Optional: Deploy Only After CI Passes

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}

    steps:
      - name: Trigger Coolify deployment
        run: |
          curl -X POST "${{ secrets.COOLIFY_WEBHOOK_URL }}"
```

Then in Coolify:
1. **Disable** the automatic webhook (so it doesn't double-deploy)
2. Copy the webhook URL
3. In GitHub, go to your repo > **Settings > Secrets and variables > Actions**
4. Add a secret: `COOLIFY_WEBHOOK_URL` = the Coolify webhook URL

Now deployments only happen after CI passes.

## 6. Rollback

If a deployment breaks the site:

1. In Coolify, go to your blog resource > **Deployments**
2. Find the last working deployment
3. Click **Rollback** to redeploy that version

Coolify keeps Docker images from previous deployments, so rollbacks are near-instant.

## 7. Multiple Environments (Optional)

If you want a staging environment:

1. Create a new branch (e.g., `staging`)
2. In Coolify, add a second resource pointing to the same repo but the `staging` branch
3. Set the domain to `staging.yourdomain.com`
4. Now pushes to `staging` deploy to the staging URL, and pushes to `main` deploy to production

## 8. Monitoring

### In Coolify

- **Logs**: view real-time container logs (nginx access/error logs)
- **Deployments**: history of all deployments with build logs
- **Server**: CPU, RAM, and disk usage for the host

### Useful commands via SSH

```bash
# Check running containers
docker ps

# View nginx logs for the blog
docker logs <blog-container-id> --tail 100

# Check disk usage
df -h

# Check memory usage
free -h
```

## Quick Reference

| What | Value |
|------|-------|
| Repo | `richmosko/hi-my-name-is-rich` |
| Branch | `main` |
| Build | Docker (multi-stage: node → nginx) |
| Port | 80 (Traefik handles 443/SSL) |
| Build var | `VITE_REMARK42_HOST=https://remark42.yourdomain.com` |
| Deploy trigger | Push to `main` via webhook |
| Rollback | Coolify dashboard > Deployments > Rollback |

## Next Steps

- Deploy Remark42: [REMARK42-SETUP.md](./REMARK42-SETUP.md)
- Set up Cloudflare CDN: [CLOUDFLARE-CDN-SETUP.md](./CLOUDFLARE-CDN-SETUP.md)
