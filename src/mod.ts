import { Application } from "../deps/oak.ts";
import { IContext } from "./controllers/context.ts";
import { initControllers } from "./controllers/mod.ts";

export async function start() {
  const app = new Application<IContext>();
  await initControllers(app);
  app.addEventListener("listen", (e) => {
    console.log(`Listening on http://localhost:${e.port}`);
  });
  await app.listen({ port: 8000 });
}
