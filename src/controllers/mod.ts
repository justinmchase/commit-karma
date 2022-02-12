import { Application } from '../../deps/oak.ts';
import { WebhookController } from "./webhook.controller.ts";

export async function initControllers(app: Application) {
  const webhook = new WebhookController();
  await webhook.use(app);
}
