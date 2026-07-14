# Production Deployment Guide

This guide details the step-by-step instructions to deploy OmniChannel (WhatsApp Automation SaaS) in a production environment.

---

## 🏗️ 1. Infrastructure Requirements

- **Server**: Virtual Private Server (VPS) or cloud instance (AWS EC2, DigitalOcean Droplet) with at least 2 vCPUs and 4GB RAM.
- **OS**: Ubuntu 22.04 LTS or any system supporting Docker.
- **Domain**: Registered domain with DNS records pointed to the server's IP address.
- **Port Access**:
  - `80` (HTTP) & `443` (HTTPS)
  - `8080` (FastAPI backend - internal/external proxy)
  - `3000` (Next.js frontend - internal/external proxy)

---

## 🛠️ 2. Environment Configurations

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Generate a secure `SECRET_KEY` for JWT signatures:
   ```bash
   openssl rand -hex 32
   ```
3. Set your Meta Cloud verify token and app secrets inside the configuration.

---

## 🐋 3. Docker Deployment (Recommended)

To run the entire stack (PostgreSQL, Redis, FastAPI backend, Next.js dashboard) inside container networks:

```bash
# 1. Build and launch services in detached mode
docker compose up -d --build

# 2. Check logs to ensure clean startups
docker compose logs -f

# 3. Stop services
docker compose down
```

---

## 📦 4. Traditional Deployment (Bare Metal)

### Backend (Gunicorn + Uvicorn)
1. Initialize python environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
2. Generate database tables:
   ```bash
   python -c "from app.db.base import Base; from app.db.session import engine; Base.metadata.create_all(bind=engine)"
   ```
3. Run using Gunicorn workers:
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8080
   ```

### Frontend (Next.js Node Runner)
1. Install and compile:
   ```bash
   cd dashboard
   npm ci
   npm run build
   ```
2. Run PM2 process manager:
   ```bash
   pm2 start npm --name "wa-dashboard" -- start
   ```

---

## 🛡️ 5. Reverse Proxy & SSL (Nginx)

Configure Nginx to proxy connections and terminate SSL certificates:

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name app.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## 🔌 6. Webhooks Handshake Configuration

1. In your **Meta App Console**, under **WhatsApp > Configuration**:
   - Set **Callback URL** to `https://app.yourdomain.com/webhook/meta`.
   - Set **Verify Token** to your custom string configured inside your dashboard workspace panel.
2. Under **Webhooks Fields**, subscribe to `messages` updates.
