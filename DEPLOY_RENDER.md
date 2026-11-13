# Deploying Suman Website Backend (Strapi) on Render

This guide walks you through deploying this Strapi 5 project on [Render](https://render.com). The setup uses a **PostgreSQL** database (provided by Render) and **Cloudinary** for media storage.

---

## Prerequisites

- A [Render account](https://dashboard.render.com/register)
- A [Cloudinary account](https://cloudinary.com) (already configured in this project)
- This repository pushed to **GitHub** or **GitLab**

---

## Step 1 — Push Your Code to a Git Repository

Render deploys directly from a Git provider. If you haven't already:

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin <your-github-or-gitlab-repo-url>
git push -u origin main
```

Make sure your `.gitignore` includes `.env` and `.tmp/` so secrets and the SQLite dev database are never committed:

```
.env
.tmp/
node_modules/
build/
dist/
```

---

## Step 2 — Create a PostgreSQL Database on Render

1. Go to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **PostgreSQL**.
3. Fill in the form:
   - **Name**: `suman-website-db` (or any name you prefer)
   - **Region**: Choose one close to your users
   - **PostgreSQL Version**: `16` (recommended)
   - **Plan**: Free (or paid for production)
4. Click **Create Database**.
5. Once created, go to the database page and copy the **Internal Database URL** (you'll use it as `DATABASE_URL` in Step 4).

---

## Step 3 — Create a Web Service on Render

1. From the Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub/GitLab account and select this repository.
3. Configure the service:

   | Field | Value |
   |---|---|
   | **Name** | `suman-website-be` |
   | **Region** | Same region as your database |
   | **Branch** | `main` |
   | **Root Directory** | `SUMAN_WEBSITE_BE` (if the repo contains both FE and BE folders) |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm run start` |
   | **Plan** | Free or Starter |

> **Note on Root Directory**: If your repository root is `SUMAN_WEBSITE_BE` itself (not a monorepo), leave the Root Directory field empty.

---

## Step 4 — Configure Environment Variables

In your Web Service on Render, go to **Environment** → **Environment Variables** and add the following:

### Database (PostgreSQL)

| Key | Value |
|---|---|
| `DATABASE_CLIENT` | `postgres` |
| `DATABASE_URL` | *(paste the Internal Database URL from Step 2)* |
| `DATABASE_SSL` | `true` |

> Using `DATABASE_URL` (the connection string) is the simplest approach. The `config/database.ts` in this project already supports it for the postgres client.

### Strapi Secrets

Generate secure random values for each of these. You can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Run that command 4 times to get 4 unique values.

| Key | Value |
|---|---|
| `APP_KEYS` | `"key1,key2,key3,key4"` *(comma-separated, quoted)* |
| `API_TOKEN_SALT` | *(random 32-byte base64 string)* |
| `ADMIN_JWT_SECRET` | *(random 32-byte base64 string)* |
| `JWT_SECRET` | *(random 32-byte base64 string)* |
| `TRANSFER_TOKEN_SALT` | *(random 32-byte base64 string)* |
| `ENCRYPTION_KEY` | *(random 32-byte base64 string)* |

### Server

| Key | Value |
|---|---|
| `HOST` | `0.0.0.0` |
| `PORT` | `1337` |
| `NODE_ENV` | `production` |

### Cloudinary (Media Storage)

| Key | Value |
|---|---|
| `CLOUDINARY_NAME` | *(your Cloudinary cloud name)* |
| `CLOUDINARY_KEY` | *(your Cloudinary API key)* |
| `CLOUDINARY_SECRET` | *(your Cloudinary API secret)* |

> These values are found in your [Cloudinary Dashboard](https://console.cloudinary.com) under **Settings → API Keys**.

---

## Step 5 — Deploy

1. Click **Save Changes** (or **Create Web Service** if this is your first deploy).
2. Render will automatically trigger a build. You can watch the logs under the **Logs** tab.
3. The build runs `npm install && npm run build` (compiles TypeScript and builds the Strapi admin panel).
4. On success, the service starts with `npm run start`.

Your Strapi API will be live at:
```
https://suman-website-be.onrender.com
```
(or whatever URL Render assigns — check the top of your Web Service page)

---

## Step 6 — Create the Admin User

On the first deploy, the database is empty. You need to register an admin:

1. Visit: `https://<your-render-url>/admin`
2. Fill in the **registration form** to create your first administrator account.
3. Log in and start managing content.

---

## Step 7 — (Optional) Set Up Auto-Deploy

By default, Render automatically redeploys every time you push to your connected branch. You can control this under **Settings → Build & Deploy → Auto-Deploy**.

---

## Important Notes

### SQLite is NOT suitable for production on Render
Render's file system is **ephemeral** — any files written at runtime (including an SQLite `.db` file) are lost on every redeploy or restart. This is why `DATABASE_CLIENT=postgres` must be set, using the Render PostgreSQL service.

### Free Tier Limitations
- The **Free** web service plan spins down after 15 minutes of inactivity. The first request after spin-down will take ~30 seconds to respond.
- The **Free** PostgreSQL plan expires after **90 days**. Upgrade to a paid plan for persistent production databases.

### CORS Configuration
If your frontend (`suman_project_FE`) is deployed on a different domain, update `config/middlewares.ts` to allow that origin:

```typescript
{
  name: 'strapi::cors',
  config: {
    origin: ['https://your-frontend-domain.com'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  },
},
```

### Health Check
Render can optionally ping a health check URL. Set it to `/` or `/_health` under **Settings → Health & Alerts** in your Web Service.

---

## Environment Variables Summary

Here is a complete `.env`-style reference for Render's environment panel:

```env
# Server
HOST=0.0.0.0
PORT=1337
NODE_ENV=production

# Strapi Secrets
APP_KEYS="<key1>,<key2>,<key3>,<key4>"
API_TOKEN_SALT=<random>
ADMIN_JWT_SECRET=<random>
JWT_SECRET=<random>
TRANSFER_TOKEN_SALT=<random>
ENCRYPTION_KEY=<random>

# Database (PostgreSQL on Render)
DATABASE_CLIENT=postgres
DATABASE_URL=<Internal Database URL from Render>
DATABASE_SSL=true

# Cloudinary
CLOUDINARY_NAME=<your-cloud-name>
CLOUDINARY_KEY=<your-api-key>
CLOUDINARY_SECRET=<your-api-secret>
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Build fails: `Cannot find module` | Make sure all dependencies are in `dependencies` (not `devDependencies`) in `package.json` |
| `SSL error` connecting to DB | Ensure `DATABASE_SSL=true` is set |
| Admin panel is blank / CSS missing | Make sure `npm run build` ran successfully before `npm run start` |
| 502 / service unavailable | Check Render logs; the free tier may be spinning up — wait 30s and retry |
| Media uploads not persisting | This is expected without Cloudinary. Ensure Cloudinary env vars are set correctly |
