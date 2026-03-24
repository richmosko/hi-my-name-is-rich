# Vikunja Task Manager Setup

Self-hosted task/bug tracking via [Vikunja](https://vikunja.io/), deployed alongside the blog on the Hetzner VPS via Coolify.

## Why Vikunja

- **Lightweight** — single Go binary, ~30-50MB RAM idle with SQLite
- **Full-featured** — Kanban boards, Gantt charts, lists, labels, priorities, subtasks
- **REST API** — query projects/tasks/labels programmatically for blog integration
- **CalDAV** — syncs with calendar apps (Apple Calendar, Thunderbird, etc.)
- **Open source** — AGPLv3, self-hosted, you own all data
- **ARM64 support** — runs natively on Hetzner's Ampere CPUs

## Prerequisites

- Hetzner VPS with Coolify (see [HETZNER-SERVER-SETUP.md](./HETZNER-SERVER-SETUP.md))
- A subdomain (e.g., `tasks.himynameisrich.com`)
- DNS A record pointing to your server

## 1. DNS Setup

In Cloudflare (or your DNS provider), add:

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A | `tasks` | `your.server.ip` | DNS only (gray) |

## 2. Deploy via Coolify

### Option A: Docker Compose Service (recommended for simplicity)

1. In Coolify, go to **Projects > your project > Add Resource > Docker Compose**
2. Paste the following:

```yaml
services:
  vikunja:
    image: vikunja/vikunja
    environment:
      VIKUNJA_SERVICE_PUBLICURL: https://tasks.himynameisrich.com
      VIKUNJA_SERVICE_TIMEZONE: America/Los_Angeles
      VIKUNJA_SERVICE_JWTSECRET: ${VIKUNJA_JWT_SECRET}
      VIKUNJA_SERVICE_ENABLEREGISTRATION: "false"
      VIKUNJA_DATABASE_TYPE: sqlite
      VIKUNJA_DATABASE_PATH: /app/vikunja/db/vikunja.db
      VIKUNJA_CORS_ENABLE: "true"
      VIKUNJA_CORS_ORIGINS: "https://himynameisrich.com,http://localhost:5173"
      VIKUNJA_MAILER_ENABLED: "false"
    volumes:
      - vikunja-db:/app/vikunja/db
      - vikunja-files:/app/vikunja/files
    restart: unless-stopped

volumes:
  vikunja-db:
  vikunja-files:
```

3. In Coolify's **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `VIKUNJA_JWT_SECRET` | Generate with `openssl rand -base64 32` |

4. In **Network** settings:
   - **Domain**: `tasks.himynameisrich.com`
   - **Port**: `3456`
   - Traefik handles SSL automatically

5. Click **Deploy**

### Option B: With PostgreSQL (for larger datasets)

```yaml
services:
  vikunja:
    image: vikunja/vikunja
    environment:
      VIKUNJA_SERVICE_PUBLICURL: https://tasks.himynameisrich.com
      VIKUNJA_SERVICE_TIMEZONE: America/Los_Angeles
      VIKUNJA_SERVICE_JWTSECRET: ${VIKUNJA_JWT_SECRET}
      VIKUNJA_SERVICE_ENABLEREGISTRATION: "false"
      VIKUNJA_DATABASE_TYPE: postgres
      VIKUNJA_DATABASE_HOST: vikunja-db
      VIKUNJA_DATABASE_USER: vikunja
      VIKUNJA_DATABASE_PASSWORD: ${VIKUNJA_DB_PASSWORD}
      VIKUNJA_DATABASE_DATABASE: vikunja
      VIKUNJA_CORS_ENABLE: "true"
      VIKUNJA_CORS_ORIGINS: "https://himynameisrich.com,http://localhost:5173"
    volumes:
      - vikunja-files:/app/vikunja/files
    depends_on:
      vikunja-db:
        condition: service_healthy
    restart: unless-stopped

  vikunja-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: vikunja
      POSTGRES_PASSWORD: ${VIKUNJA_DB_PASSWORD}
      POSTGRES_DB: vikunja
    volumes:
      - vikunja-pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vikunja"]
      interval: 5s
      start_period: 30s
    restart: unless-stopped

volumes:
  vikunja-files:
  vikunja-pgdata:
```

**Note:** SQLite is perfectly fine for a personal task manager. Only use PostgreSQL if you expect heavy concurrent use or want to share with a team.

## 3. Initial Setup

1. Visit `https://tasks.himynameisrich.com`
2. Register your admin account (first user becomes admin)
3. **Immediately disable registration** if not already:
   - Ensure `VIKUNJA_SERVICE_ENABLEREGISTRATION: "false"` is set
   - Redeploy the service

### Create an API Token

You'll need this for the blog integration:

1. In Vikunja, go to **Settings > API Tokens**
2. Click **Create Token**
3. Name it `blog-readonly` or similar
4. Set permissions: **Read only** on projects and tasks
5. Copy the token (starts with `tk_`)
6. Save it — you'll add it to the blog's environment variables later

## 4. Verify It's Running

```bash
curl -s https://tasks.himynameisrich.com/api/v1/info | head
```

Should return JSON with Vikunja version info.

## 5. Server Memory Check

Before and after deploying, check your server's resource usage:

```bash
# Overall memory usage
free -h

# Memory by container (sorted by usage)
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.CPUPerc}}" | sort -k2 -h -r

# Just Vikunja
docker stats --no-stream --format "{{.Name}}\t{{.MemUsage}}" | grep vikunja

# Disk usage by container volumes
docker system df -v | head -30

# Total disk usage
df -h /
```

**Expected Vikunja footprint:**
- SQLite mode: ~30-50MB RAM, <10MB disk (excluding attachments)
- PostgreSQL mode: ~80-120MB (Vikunja + Postgres combined)

**Your server budget (CAX11: 4GB RAM):**
```
Coolify + Traefik + Postgres:  ~700MB
nginx (blog frontend):          ~20MB
Remark42 (comments):             ~30MB
Vikunja (SQLite):                ~40MB
OS + overhead:                  ~200MB
─────────────────────────────────────
Total:                          ~990MB
Remaining:                     ~3.0GB  ← plenty of headroom
```

## 6. Organize Projects

Create projects in Vikunja that mirror your blog projects:

| Vikunja Project | Blog Project | Purpose |
|----------------|--------------|---------|
| HiMyNameIsRich.com | `hi-my-name-is-rich` | Blog bugs, features, design tasks |
| Tahoe House Build | `tahoe-house` | Construction tasks, permits, timeline |
| Tahoe House Modeling | `tahoe-house-modeling` | 3D modeling tasks |

Use **labels** for categorization:
- `bug` — something broken
- `feature` — new functionality
- `design` — visual/UX changes
- `content` — new posts, edits
- `infra` — deployment, server, CI/CD

Use **priorities** (1-5) to rank urgency.

## 7. Backup

### Manual backup (SQLite)

```bash
# Find the container
CONTAINER=$(docker ps -qf "ancestor=vikunja/vikunja")

# Copy the database file
docker cp $CONTAINER:/app/vikunja/db/vikunja.db ./vikunja-backup-$(date +%Y%m%d).db
```

### Automated backup

Add to crontab (`crontab -e`):

```bash
0 4 * * * docker cp $(docker ps -qf "ancestor=vikunja/vikunja"):/app/vikunja/db/vikunja.db /opt/backups/vikunja-$(date +\%Y\%m\%d).db
```

### API export

```bash
curl -H "Authorization: Bearer tk_YOUR_TOKEN" \
  https://tasks.himynameisrich.com/api/v1/tasks/all | gzip > vikunja-tasks-$(date +%Y%m%d).json.gz
```

## 8. Troubleshooting

**Can't access the UI**
- Verify DNS resolves: `dig +short tasks.himynameisrich.com`
- Check container is running: `docker ps | grep vikunja`
- Check logs in Coolify's log viewer

**CORS errors from blog frontend**
- Ensure `VIKUNJA_CORS_ORIGINS` includes your blog domain
- Include both `https://` and local dev URLs

**"Forbidden" on API calls**
- Verify the API token is valid and not expired
- Check token permissions include read access to the project

**Registration disabled but need another user**
- Temporarily set `VIKUNJA_SERVICE_ENABLEREGISTRATION: "true"`, redeploy, register, then disable again

---

## API Integration Ideas

Below are ideas for integrating Vikunja data into the blog, from simple to ambitious.

### Idea 1: Task Counts on Project Pages

Display open/closed task counts and a progress bar on each project detail page.

**API calls:**
```
GET /api/v1/projects/{id}/tasks?filter=done&filter_value=false  → open tasks
GET /api/v1/projects/{id}/tasks?filter=done&filter_value=true   → closed tasks
```

**What it looks like:**
```
┌─ HiMyNameIsRich.com ──────────────────────┐
│  ████████████░░░░  68% complete            │
│  23 closed · 11 open · 3 bugs             │
└────────────────────────────────────────────┘
```

**Complexity:** Low — a few fetch calls on the project detail page.

### Idea 2: Live Bug/Issue Badge in Sidebar

Show open bug count next to each project in the sidebar.

**API calls:**
```
GET /api/v1/projects/{id}/tasks?filter=done&filter_value=false&filter=labels&filter_value=bug
```

**What it looks like:**
```
Projects
  HiMyNameIsRich.com  68%  🔴 3
  Tahoe House Build   19%  🔴 1
```

**Complexity:** Low — extend the existing sidebar project list.

### Idea 3: Recent Activity Feed on Admin Dashboard

Show recently created/completed tasks across all projects on the admin page.

**API calls:**
```
GET /api/v1/tasks/all?sort_by=updated&order_by=desc&per_page=20
```

**What it looks like:**
A "Recent Task Activity" tab on `/admin` showing:
```
✅ Fix dark mode comment styling — 2h ago
🆕 Add image lazy loading — 5h ago
✅ Deploy Vikunja — 1d ago
```

**Complexity:** Medium — new tab on admin page, similar to the Remark42 comments tab.

### Idea 4: Kanban Board Embed on Project Detail Pages

Embed a read-only Kanban view of a project's tasks directly on the blog's project page.

**API calls:**
```
GET /api/v1/projects/{id}/buckets  → Kanban columns (To Do, In Progress, Done)
GET /api/v1/projects/{id}/tasks    → all tasks with bucket_id
```

**What it looks like:**
```
┌── To Do ──┐  ┌── In Progress ──┐  ┌── Done ──┐
│ Add search │  │ Fix mobile nav  │  │ Dark mode│
│ Add RSS    │  │                 │  │ Comments │
│            │  │                 │  │ Deploy   │
└────────────┘  └─────────────────┘  └──────────┘
```

**Complexity:** Medium-high — custom Kanban component, responsive layout.

### Idea 5: Bug Report Button on Posts/Projects

Add a "Report Bug" or "Suggest Feature" button that creates a Vikunja task directly.

**API calls:**
```
POST /api/v1/projects/{id}/tasks
Body: { "title": "Bug: ...", "description": "...", "labels": [{"id": bug_label_id}] }
```

**Complexity:** Medium — needs a form UI, API write access, and rate limiting.

### Idea 6: Changelog Generated from Completed Tasks

Auto-generate a changelog page from recently completed tasks, grouped by date.

**API calls:**
```
GET /api/v1/tasks/all?filter=done&filter_value=true&sort_by=done_at&order_by=desc&per_page=50
```

**What it looks like:**
```
## March 2026

- ✅ Dark mode support (Mar 21)
- ✅ Constellation graph (Mar 20)
- ✅ Remark42 comments (Mar 19)
- ✅ Post search + filtering (Mar 18)

## February 2026
...
```

**Complexity:** Low — simple list page with date grouping.

### Idea 7: Task Metrics Dashboard

A dedicated `/metrics` or `/status` page with charts:
- Tasks created vs completed over time (line chart)
- Open tasks by label (bar chart)
- Tasks by priority (pie chart)
- Average time to close

**API calls:**
```
GET /api/v1/tasks/all  → fetch all tasks, compute metrics client-side
```

**Complexity:** High — needs a charting library (Chart.js or Recharts) and data processing.

### Idea 8: Replace MDX Task Lists with Vikunja

Currently your project MDX files have hardcoded task lists. You could migrate these to Vikunja and have the project pages fetch tasks live:

**Before (MDX):**
```yaml
tasks:
  - name: "Set up CI/CD"
    completed: true
  - name: "Add dark mode"
    completed: false
```

**After (Vikunja API):**
Tasks are managed in Vikunja's UI (Kanban, lists, etc.) and the blog fetches them at render time. The MDX file just references the Vikunja project ID:

```yaml
vikunjaProjctId: 5
```

**Complexity:** High — migration effort, but eliminates duplicate task tracking.

---

## Recommended Starting Point

1. **Deploy Vikunja** (this guide)
2. **Create API token** with read-only permissions
3. **Implement Idea 1** (task counts on project pages) — low effort, high impact
4. **Implement Idea 6** (changelog) — also low effort, very useful
5. Consider Ideas 2-5 later as the workflow matures

## Environment Variable for Blog Integration

Once you have an API token, add it to Coolify as a **build variable** for the blog frontend:

```
VITE_VIKUNJA_HOST=https://tasks.himynameisrich.com
VITE_VIKUNJA_TOKEN=tk_your_read_only_token_here
```

Then fetch in React:
```typescript
const res = await fetch(`${VIKUNJA_HOST}/api/v1/projects/${projectId}/tasks`, {
  headers: { Authorization: `Bearer ${VIKUNJA_TOKEN}` },
});
const tasks = await res.json();
```

**Security note:** The API token is inlined by Vite at build time. Use a **read-only** token to limit exposure. For write operations (Idea 5), use a server-side proxy or Coolify environment variable that's runtime-only.
