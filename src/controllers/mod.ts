import { Application } from "../../deps/oak.ts";
import { IContext } from "./context.ts";
import { Managers } from "../managers/mod.ts";
import { Services } from "../services/mod.ts";
import { ErrorController } from "./error.controller.ts";
import { HealthController } from "./health.controller.ts";
import { LogController } from "./log.controller.ts";
import { ParseController } from "./parse.controller.ts";
import { WebhookController } from "./webhook.controller.ts";
import { NotFoundController } from "./notfound.controller.ts";

export async function initControllers(
  app: Application<IContext>,
  managers: Managers,
  services: Services,
) {
  const { env, github, analytics } = services;
  const { installations, interactions } = managers;
  const webhookPath = env["GITHUB_WEBHOOK_PATH"];
  const error = new ErrorController();
  const health = new HealthController();
  const log = new LogController();
  const parse = new ParseController();
  const webhook = new WebhookController(
    installations,
    interactions,
    github,
    analytics,
    webhookPath,
  );
  const notfound = new NotFoundController();

  await error.use(app);
  await health.use(app);
  await log.use(app);
  await parse.use(app);
  await webhook.use(app);
  await notfound.use(app);
}
