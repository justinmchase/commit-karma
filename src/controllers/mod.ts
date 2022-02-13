import { Application } from '../../deps/oak.ts';
import { Managers } from "../managers/mod.ts";
import { WebhookController } from "./webhook.controller.ts";

export async function initControllers(app: Application, managers: Managers) {
  const { installations } = managers
  const webhook = new WebhookController(installations);
  await webhook.use(app);
}
