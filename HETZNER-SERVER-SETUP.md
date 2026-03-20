# Hetzner Server Setup

This guide walks through provisioning a Hetzner Cloud VPS with Coolify pre-installed, setting up SSH keys, and getting everything ready to deploy the blog and Remark42.

## 1. Create a Hetzner Cloud Account

1. Go to [hetzner.com/cloud](https://www.hetzner.com/cloud/) and sign up
2. Verify your account (may require ID verification and a small initial deposit)
3. Create a new **Project** in the Hetzner Cloud Console (e.g., "Personal Blog")

## 2. Generate SSH Keys

SSH keys let you securely connect to your server without a password. If you already have SSH keys, skip to step 2c.

### 2a. Check for existing keys

```bash
ls -la ~/.ssh/
```

If you see `id_ed25519` and `id_ed25519.pub` (or `id_rsa` / `id_rsa.pub`), you already have keys. Skip to step 2c.

### 2b. Generate a new key pair

```bash
ssh-keygen -t ed25519 -C "your@email.com"
```

- Press **Enter** to accept the default file location (`~/.ssh/id_ed25519`)
- Enter a passphrase (recommended) or press **Enter** for no passphrase
- This creates two files:
  - `~/.ssh/id_ed25519` — your **private** key (never share this)
  - `~/.ssh/id_ed25519.pub` — your **public** key (this goes on the server)

### 2c. Copy your public key

```bash
cat ~/.ssh/id_ed25519.pub
```

Copy the entire output (starts with `ssh-ed25519 ...`). You'll paste this into Hetzner in the next step.

## 3. Add SSH Key to Hetzner

1. In the Hetzner Cloud Console, go to **Security > SSH Keys**
2. Click **Add SSH Key**
3. Paste your public key from step 2c
4. Give it a name (e.g., "MacBook Pro")
5. Click **Add SSH Key**

This key will be available to select when creating servers. You can add multiple keys if you connect from different machines.

## 4. Create the Server

1. In your Hetzner project, click **Add Server**

### Location

2. Select a **Location** — choose an EU datacenter:
   - **Falkenstein (FSN1)** — Germany, central EU
   - **Nuremberg (NBG1)** — Germany, central EU
   - **Helsinki (HEL1)** — Finland

   Any of these work. Pick whichever is closest to your primary audience, or just go with Falkenstein (most common choice).

### Image

3. Under **Image**, click the **Apps** tab
4. Select **Coolify**

   This installs Ubuntu with Coolify pre-configured. No need to install Coolify manually later.

### Type

5. Under **Type**, select **Arm64 (Ampere)** architecture tab
6. Choose **CAX11** (2 vCPU / 4 GB RAM / 40 GB SSD) — ~3.29 EUR/mo
   - Or **CAX21** (4 vCPU / 8 GB RAM / 80 GB SSD) — ~5.49 EUR/mo if you want more headroom
   - CAX11 is plenty for the blog + Remark42 + Coolify

### Networking

7. Under **Networking**:
   - **Public IPv4**: Enabled (required)
   - **Public IPv6**: Enabled (free, recommended)
   - **Private Networks**: Skip for now (not needed for a single server)

### SSH Keys

8. Under **SSH Keys**, check the box next to the key you added in step 3
   - You can select multiple keys if you want to connect from multiple machines

### Volumes

9. Skip — the built-in 40 GB SSD is sufficient. You can add a volume later if needed.

### Firewalls

10. Click **Create Firewall** (or skip and configure later):

    **Recommended inbound rules:**

    | Port | Protocol | Source | Purpose |
    |------|----------|--------|---------|
    | 22 | TCP | Your IP (or any) | SSH access |
    | 80 | TCP | Any | HTTP (Cloudflare / Let's Encrypt) |
    | 443 | TCP | Any | HTTPS (Cloudflare / Traefik) |
    | 8000 | TCP | Your IP only | Coolify dashboard |

    **Tip:** If you're using Cloudflare, you can restrict ports 80/443 to only Cloudflare's IP ranges for extra security. Cloudflare publishes their IPs at [cloudflare.com/ips](https://www.cloudflare.com/ips/).

    Leave all outbound rules as **Allow all** (default).

### Cloud Config / User Data

11. Skip — Coolify's app image handles initial setup.

### Backups

12. **Enable backups** — adds ~20% to the monthly cost but gives you automatic weekly server snapshots. Highly recommended for peace of mind. You can also take manual snapshots before major changes.

### Name

13. Give your server a name (e.g., `blog-prod` or `himynameisrich`)

### Create

14. Click **Create & Buy Now**

The server will be provisioned in about 30 seconds. Note the **public IPv4 address** shown on the server detail page — you'll need this throughout the setup.

## 5. First SSH Connection

### Connect to the server

```bash
ssh root@YOUR_SERVER_IP
```

If this is your first time connecting, you'll see a fingerprint verification prompt:

```
The authenticity of host 'YOUR_SERVER_IP' can't be established.
ED25519 key fingerprint is SHA256:xxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Type `yes` and press Enter. This adds the server to your `~/.ssh/known_hosts`.

### Verify Coolify is running

Once logged in:

```bash
docker ps
```

You should see several Coolify containers running (coolify, traefik, postgres, redis, etc.). If Docker isn't ready yet, wait a minute and try again — the Coolify app image may still be initializing on first boot.

### Check the Coolify version

```bash
curl -s http://localhost:8000/api/health
```

## 6. Set Up Swap

The CAX11 has 4 GB RAM which is comfortable, but adding swap provides a safety net during Docker image builds:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

Verify:

```bash
free -h
```

You should see the swap space listed.

## 7. Access the Coolify Dashboard

### Option A: Direct access (if port 8000 is open)

1. Open your browser and go to `http://YOUR_SERVER_IP:8000`
2. Create your admin account on first visit

### Option B: SSH tunnel (more secure — recommended)

If you restricted port 8000 in the firewall to only your IP (or blocked it entirely), use an SSH tunnel:

```bash
ssh -L 8000:localhost:8000 root@YOUR_SERVER_IP
```

Then open `http://localhost:8000` in your browser.

### Initial Coolify setup

1. Create your admin account (email + password)
2. Go to **Settings > Server** — verify the local server is connected and healthy
3. Go to **Settings > General**:
   - Set your instance URL (e.g., `http://YOUR_SERVER_IP:8000` or a subdomain if you want)
   - Configure email notifications (optional)

## 8. Point Your Domain

### At your domain registrar (before Cloudflare)

If you're setting up Cloudflare right away, skip this and go straight to the Cloudflare setup guide. Otherwise, create these A records at your registrar:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` (or `yourdomain.com`) | `YOUR_SERVER_IP` | 300 |
| A | `remark42` | `YOUR_SERVER_IP` | 300 |
| A | `www` | `YOUR_SERVER_IP` | 300 |

### Verify DNS propagation

```bash
dig +short yourdomain.com
```

Should return your server's IP.

## 9. Create a Non-Root User (Optional but Recommended)

Running everything as root works but isn't ideal long-term:

```bash
# Create user
adduser deploy

# Add to sudo and docker groups
usermod -aG sudo deploy
usermod -aG docker deploy

# Copy your SSH key to the new user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Test the new user:

```bash
ssh deploy@YOUR_SERVER_IP
```

## 10. Harden SSH (Optional but Recommended)

Edit the SSH config:

```bash
nano /etc/ssh/sshd_config
```

Recommended changes:

```
# Disable password authentication (SSH keys only)
PasswordAuthentication no

# Disable root login (if you created a non-root user)
PermitRootLogin no

# Change default port (optional — reduces automated scan noise)
# Port 2222
```

Restart SSH:

```bash
sudo systemctl restart ssh
```

**Important:** Before disabling root login, make sure you can successfully SSH in as your non-root user. Keep your current SSH session open as a fallback while testing.

If you changed the SSH port, update your firewall rule in Hetzner and connect with:

```bash
ssh -p 2222 deploy@YOUR_SERVER_IP
```

## 11. Enable Automatic Updates (Optional)

Keep the OS patched automatically:

```bash
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

Select **Yes** to enable automatic security updates.

## Next Steps

Your server is now ready. Follow these guides in order:

1. **[REMARK42-SETUP.md](./REMARK42-SETUP.md)** — Deploy the blog and Remark42 via Coolify
2. **[CLOUDFLARE-CDN-SETUP.md](./CLOUDFLARE-CDN-SETUP.md)** — Set up Cloudflare CDN for global performance

## Quick Reference

| What | Where |
|------|-------|
| Server IP | Hetzner Cloud Console > your server |
| SSH connection | `ssh root@YOUR_SERVER_IP` (or `deploy@` if hardened) |
| Coolify dashboard | `http://YOUR_SERVER_IP:8000` or via SSH tunnel |
| Server specs | CAX11: 2 Arm64 vCPU / 4 GB RAM / 40 GB SSD |
| Monthly cost | ~3.29 EUR + ~0.66 EUR backups |
| Datacenter | Falkenstein / Nuremberg / Helsinki |
