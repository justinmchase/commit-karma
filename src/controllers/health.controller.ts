import { Application, Router, Response, Status } from "../../deps/oak.ts";
import { IContext } from "./context.ts";
import { Controller } from "./controller.ts";

export class HealthController implements Controller {
  public async use(app: Application<IContext>): Promise<void> {
    const router = new Router();
    router.get(
      "/health",
      async (context, _next) => await this.handler(context.response),
    );
    app.use(router.allowedMethods());
    app.use(router.routes());
    await undefined;
  }

  private async handler(res: Response) {
    res.status = Status.OK;
    res.body = { ok: true };
    res.headers.set("Content-Type", "application/json");
    await undefined;
  }
}