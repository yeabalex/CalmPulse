# CalmPulse

Next.js app for anxiety pacing, cohort pods, and daily reflection tracking.

## MongoDB Atlas setup

CalmPulse uses MongoDB for users, pods, messages, and daily logs. It works with **local MongoDB** or **MongoDB Atlas**.

### 1. Create an Atlas cluster

1. Sign up at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. **Database Access** → add a database user (username + password)
4. **Network Access** → add your IP (use `0.0.0.0/0` only for local dev)

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/calmpulse?retryWrites=true&w=majority
MONGODB_DB=calmpulse
JWT_SECRET=your-long-random-secret
GROQ_API_KEY=your-groq-key
```

Replace `USER`, `PASSWORD`, and `CLUSTER` with your Atlas values. URL-encode special characters in passwords.

If your Atlas URI has no database name in the path (ends with `mongodb.net/?retryWrites=...`), set `MONGODB_DB` explicitly.

### 3. Verify the connection

```bash
npm run db:check
```

### 4. Create indexes (recommended for Atlas)

```bash
npm run db:setup-indexes
```

### Local MongoDB (alternative)

```env
MONGODB_URI=mongodb://127.0.0.1:27017/calmpulse
```

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying (Vercel + Atlas)

Add these environment variables in your hosting provider:

| Variable | Required |
|----------|----------|
| `MONGODB_URI` | Yes |
| `MONGODB_DB` | Yes (if not in URI path) |
| `JWT_SECRET` | Yes |
| `GROQ_API_KEY` | Optional (AI features) |

Run `npm run db:setup-indexes` once against your Atlas database before going live.

## CI/CD (GitHub Actions → GHCR → EC2)

On every push to `main`, GitHub Actions:

1. Builds the Docker image
2. Pushes to `ghcr.io/yeabalex/calmpulse:latest`
3. SSHs into EC2, pulls the image, and restarts the container

### One-time EC2 setup

```bash
# Install Docker
sudo apt update && sudo apt install -y docker.io
sudo usermod -aG docker $USER
# log out and back in

# App env file (never commit this)
sudo mkdir -p /opt/calmpulse
sudo cp deploy/ec2.env.example /opt/calmpulse/.env
sudo nano /opt/calmpulse/.env
```

### GitHub repository secrets

| Secret | Description |
|--------|-------------|
| `EC2_HOST` | EC2 public IP or DNS |
| `EC2_USER` | SSH user (`ubuntu` for Ubuntu AMI) |
| `EC2_SSH_PRIVATE_KEY` | Contents of your `.pem` key pair from AWS |
| `GHCR_PULL_TOKEN` | GitHub PAT with `read:packages` (for EC2 to pull the image) |

`GITHUB_TOKEN` is provided automatically for pushing to GHCR.

To create `GHCR_PULL_TOKEN`: GitHub → Settings → Developer settings → Personal access tokens → `read:packages`.

### Manual deploy on EC2

```bash
export IMAGE=ghcr.io/yeabalex/calmpulse:latest
export GHCR_USERNAME=your-github-username
export GHCR_TOKEN=your-pat-with-read-packages
bash scripts/ec2-deploy.sh
```
