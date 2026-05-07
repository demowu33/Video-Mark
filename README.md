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

## Vercel + Supabase Deployment

This is the recommended low-cost demo deployment:

- Vercel runs the Next.js app.
- Supabase Postgres stores users, projects, versions, comments, annotations, and notifications.
- Supabase Storage stores uploaded videos in a private bucket.

Create a Supabase project, then create a private Storage bucket named `videos`.

Set these environment variables in Vercel:

```text
DATABASE_URL=your Supabase pooled or direct Postgres connection string
APP_URL=https://your-vercel-domain.vercel.app
SESSION_DAYS=14
SHOW_DEV_LOGIN_CODE=true
STORAGE_DRIVER=supabase
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your Supabase service_role key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your Supabase anon key
SUPABASE_STORAGE_BUCKET=videos
```

The Vercel build command is defined in `vercel.json` and runs Prisma migrations before building.

Production note: `SHOW_DEV_LOGIN_CODE=true` is only for a temporary demo because it displays login codes in the browser. Turn it off and add real email delivery before inviting a wider team.
