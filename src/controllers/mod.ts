import { Application } from '../../deps/oak.ts';
import { Managers } from "../managers/mod.ts";
import { Services } from "../services/mod.ts";
import { WebhookController } from "./webhook.controller.ts";

export async function initControllers(app: Application, managers: Managers, services: Services) {
  const { installations, interactions } = managers
  const { github } = services
  const webhook = new WebhookController(installations, interactions, github);
  await webhook.use(app);
}
