import { Application } from "../deps/oak.ts";
import { IContext } from "./controllers/context.ts";
import { initServices } from "./services/mod.ts";
import { initManagers } from "./managers/mod.ts";
import { initControllers } from "./controllers/mod.ts";

export async function start() {
  const app = new Application<IContext>();
  const services = await initServices();
  const managers = await initManagers(services);
  await initControllers(app, managers, services);
  app.addEventListener("listen", (e) => {
    console.log(`Listening on http://localhost:${e.port}`);
  });
  await app.listen({ port: 8000 });
}
