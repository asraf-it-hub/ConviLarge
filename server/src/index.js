import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { ensureStorage } from "./utils/fs.js";
import { startCleanupJob } from "./services/cleanupService.js";

await ensureStorage();
await connectDb();
startCleanupJob();

const app = createApp();

app.listen(env.port, () => {
  console.log(`ConviLarge API running on http://localhost:${env.port}`);
});
