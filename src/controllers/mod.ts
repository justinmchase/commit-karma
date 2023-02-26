import { HealthController, LogController, IsHtmlController } from "#grove/mod.ts";
import { Application } from "../../deps/oak.ts";
import { Context, State } from "../context.ts";
import { ErrorController } from "./error.controller.ts";
// import { ParseController } from "./parse.controller.ts";
import { WebhookController } from "./webhook.controller.ts";
import { NotFoundController } from "./notfound.controller.ts";
import { readString } from "../util/config.ts";

export async function initControllers(
  context: Context,
  app: Application<State>,
) {
  const {
    services: {
      env,
      github,
      analytics,
      logging
    },
    managers: {
      installations,
      interactions
    }
  } = context;

  // This can be any guid, it needs to be configured here as well as in the github app and in the marketplace
  const webhookPath = readString(env, "GITHUB_WEBHOOK_PATH", "/webhook");

  const error = new ErrorController(analytics);
  const health = new HealthController();
  const log = new LogController(logging);
  const isHtml = new IsHtmlController();
  const webhook = new WebhookController(
    logging,
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
  await isHtml.use(app);
  await webhook.use(app);
  await notfound.use(app);
}
