# ConviLarge

Production-style full-stack MVP for temporary file conversion tools.

## Structure

- `client/` React, Vite, Tailwind CSS, Framer Motion
- `server/` Express API, local temp storage, auth, processors, cleanup jobs

## Run Locally

1. Copy `.env.example` to `.env`.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the API and the website in two terminals:

   ```bash
   npm run dev:server
   ```

   ```bash
   npm run dev:client
   ```

Client: `http://localhost:5173`  
API: `http://localhost:5000/api`

MongoDB and Redis are optional for local guest use. If MongoDB is unavailable, guest file tools still work but account features return a clear service message. Redis is prepared for queue workers; the current MVP processes inline with the same processor modules so it remains runnable without infrastructure.

## Native Helpers

- MP4 to MP3 uses `ffmpeg-static`.
- PDF lock/unlock require `qpdf` available through `QPDF_PATH`. Confirm deployment support at `/api/system/status`.
- PDF to JPG uses Sharp PDF rendering support. Use a deployment image with PDF rendering support enabled.

## Cleanup

Uploaded and processed files live in `server/uploads`, `server/temp`, and `server/processed`. Cleanup runs hourly and removes files older than `FILE_TTL_HOURS`, defaulting to 24 hours. Manual cleanup is available at:

```http
POST /api/maintenance/cleanup
```
