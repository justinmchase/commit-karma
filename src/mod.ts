import { Context } from "./context.ts";
import { initServices } from "./services/mod.ts";
import { initManagers } from "./managers/mod.ts";
import { initControllers } from "./controllers/mod.ts";
import { Grove } from "../deps/grove.ts";

async function initContext(): Promise<Context> {
  const services = await initServices();
  const managers = await initManagers(services);
  return {
    services,
    managers,
  };
}

export async function start() {
  const grove = new Grove({
    initContext,
    initControllers,
  });

  await grove.start();
}
