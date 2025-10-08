import { createServer } from "./server";
import { env } from "./env";

const app = createServer();

app.listen(env.API_PORT, () => {
  console.log(`API listening on port ${env.API_PORT}`);
});
