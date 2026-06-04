import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { ensureStorage } from "./utils/fs.js";
import { startCleanupJob } from "./services/cleanupService.js";
import { detectSystemDependencies } from "./services/systemStatusService.js";

await ensureStorage();
await detectSystemDependencies();
await connectDb();
startCleanupJob();

const app = createApp();

app.listen(env.port, () => {
  console.log(`ConviLarge API running on http://localhost:${env.port}`);
});
