# Deploying Cortex to DigitalOcean

A step-by-step guide to deploying Cortex on a DigitalOcean Droplet with Docker.

## 1. Create a Droplet

1. Sign up at [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Click **Create** > **Droplets**
3. Configure with these settings:

| Setting | Recommended |
|---------|-------------|
| Region | Nearest to you (e.g., NYC1, SFO3) |
| Image | Ubuntu 24.04 LTS |
| Size | Basic — Regular, 2 GB RAM / 1 vCPU / 50 GB disk ($12/mo) |
| Authentication | SSH Key (see below) |
| Hostname | `cortex` |

### Generate an SSH key (if you don't have one)

```bash
ssh-keygen -t ed25519 -C "your@email.com"
cat ~/.ssh/id_ed25519.pub
# Copy the output and paste it into DigitalOcean's SSH key field
```

Once the Droplet is created, note the IP address.

## 2. Initial Server Setup

SSH into your server:

```bash
ssh root@YOUR_SERVER_IP
```

### Update the system and install Docker

```bash
# Update packages
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

### Create a non-root user (recommended)

```bash
adduser cortex
usermod -aG docker cortex
# Copy SSH key to new user
mkdir -p /home/cortex/.ssh
cp ~/.ssh/authorized_keys /home/cortex/.ssh/
chown -R cortex:cortex /home/cortex/.ssh
```

From now on, SSH as `cortex@YOUR_SERVER_IP`.

### Configure the firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw enable
```

## 3. Deploy Cortex

### Clone your repository

```bash
sudo mkdir -p /opt/cortex
sudo chown cortex:cortex /opt/cortex
cd /opt/cortex

# Option A: Clone from Git
git clone https://github.com/YOUR_USER/cortex.git .

# Option B: Copy from local machine (run this on your local machine)
# rsync -avz --exclude node_modules --exclude .git \
#   /path/to/cortex/ cortex@YOUR_SERVER_IP:/opt/cortex/
```

### Configure environment variables

```bash
cp .env.example .env
nano .env
```

Set these values in `.env`:

```env
# IMPORTANT: Use a strong password — not the default
DB_PASSWORD=your_strong_password_here

# Your API keys (same as local)
OPENROUTER_API_KEY=sk-or-...
JINA_API_KEY=jina_...
API_KEY=your_internal_api_key_here

# Discord (if using the bot)
DISCORD_TOKEN=your_discord_token

# Set to your Droplet's IP
NEXT_PUBLIC_APP_URL=http://YOUR_SERVER_IP
```

### Enable Next.js standalone output

This has already been added to `app/next.config.ts`. If you're working from a fresh clone, verify it contains:

```typescript
const nextConfig: NextConfig = {
  output: "standalone",
};
```

### Build and start

```bash
cd /opt/cortex
docker compose -f docker-compose.prod.yml up -d --build
```

This will build and start all services: Postgres, Redis, the Next.js app, the BullMQ worker, the Discord bot, and Nginx.

First build takes 2-5 minutes. Watch progress with:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Run database migrations and seed

```bash
# Get the app container ID
docker compose -f docker-compose.prod.yml exec app sh

# Inside the container:
npx drizzle-kit migrate
npx tsx src/lib/db/seed.ts
exit
```

### Verify everything is running

```bash
docker compose -f docker-compose.prod.yml ps
```

All services should show `Up (healthy)`. Visit `http://YOUR_SERVER_IP` in your browser.

## 4. Migrate Your Local Data

On your **local machine**, export your existing database:

```bash
cd /path/to/cortex
./scripts/migrate-data.sh export
```

Copy the dump to your server:

```bash
scp cortex_export.sql.gz cortex@YOUR_SERVER_IP:/opt/cortex/
```

On the **server**, import it:

```bash
cd /opt/cortex
./scripts/migrate-data.sh import /opt/cortex/cortex_export.sql.gz
```

The script will print a count of items, categories, and tags to confirm success.

## 5. Set Up Automated Backups

### Local backups (daily at 3am)

```bash
sudo mkdir -p /opt/cortex/backups
crontab -e
```

Add this line:

```
0 3 * * * /opt/cortex/scripts/backup.sh >> /var/log/cortex-backup.log 2>&1
```

### Remote backups with DigitalOcean Spaces (optional)

DigitalOcean Spaces is S3-compatible object storage ($5/mo for 250 GB).

1. Create a Space in the DigitalOcean console
2. Generate a Spaces access key under **API** > **Spaces Keys**
3. Install the AWS CLI and configure it:

```bash
apt install awscli -y
aws configure
# Access Key: your Spaces key
# Secret Key: your Spaces secret
# Region: your Space's region (e.g., nyc3)
```

4. Update your crontab to use the upload flag:

```
0 3 * * * S3_BUCKET=your-space-name S3_ENDPOINT=https://nyc3.digitaloceanspaces.com /opt/cortex/scripts/backup.sh --upload >> /var/log/cortex-backup.log 2>&1
```

### Manual backup / restore

```bash
# Backup
./scripts/backup.sh

# Restore from a backup
gunzip -c backups/cortex_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i $(docker compose -f docker-compose.prod.yml ps -q db) \
  psql -U reader -d reader_organizer --single-transaction
```

## 6. Updating Cortex

When you push updates to your code:

```bash
cd /opt/cortex
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Docker will rebuild only the services that changed.

## 7. Update Your MCP Server and Chrome Extension

After deploying, update your local tools to point at the server:

### MCP Server (Claude Code)

In your Claude Code MCP settings, change the URL:

```json
{
  "env": {
    "CORTEX_API_URL": "http://YOUR_SERVER_IP",
    "CORTEX_API_KEY": "your-api-key"
  }
}
```

### Chrome Extension

Open the extension options and update the API URL to `http://YOUR_SERVER_IP`.

### Discord Bot

The Discord bot runs on the server now — you can stop your local instance.

## Useful Commands

```bash
# View logs for a specific service
docker compose -f docker-compose.prod.yml logs -f app

# Restart a single service
docker compose -f docker-compose.prod.yml restart worker

# Check resource usage
docker stats

# Open a psql shell
docker compose -f docker-compose.prod.yml exec db psql -U reader reader_organizer

# Stop everything
docker compose -f docker-compose.prod.yml down

# Stop everything AND delete data (careful!)
docker compose -f docker-compose.prod.yml down -v
```
