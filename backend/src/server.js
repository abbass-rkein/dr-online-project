import { createApp } from "./app.js";
import { config } from "./config.js";
import { pingDb } from "./db.js";

const app = createApp();

await pingDb();
app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}`);
});
