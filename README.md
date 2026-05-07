# Video Mark

Internal video review app for teams. Members can create projects, upload video versions, leave time-based comments with frame annotations, reply to comments, and track review status.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start PostgreSQL:

   ```bash
   docker compose up -d db
   ```

3. Configure environment variables and migrate the database:

   ```bash
   cp .env.example .env
   npm run prisma:migrate
   npm run dev
   ```

Open `http://localhost:3000`. In development, login verification codes are shown directly on the login page.

## Docker

```bash
docker compose up --build
```

Uploaded videos are stored in the `upload_data` Docker volume. FFmpeg is used to read video duration and generate thumbnails. If FFmpeg is unavailable, uploads still work, but duration or thumbnails may be missing.

## Render Deployment

This repository includes `render.yaml` for a Render Blueprint:

- Docker web service for the Next.js app
- Managed PostgreSQL database
- Persistent disk mounted at `/data/video-mark/uploads`
- `UPLOAD_DIR` configured to store uploaded videos on that disk

After pushing this repo to GitHub:

1. Open Render Dashboard.
2. Choose **New > Blueprint**.
3. Connect this GitHub repository.
4. Set `APP_URL` to the Render service URL after the first deploy, for example `https://video-mark.onrender.com`.
5. Deploy the Blueprint.

The Docker container runs `prisma migrate deploy` before starting the app, so database migrations are applied automatically on deploy.

Production note: email delivery is not wired yet. Until a real email provider is added, production login code delivery needs to be implemented before inviting a wider team.
