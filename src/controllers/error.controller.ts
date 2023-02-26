import { Controller } from "#grove/mod.ts";
import { Application, Context, Status } from "../../deps/oak.ts";
import { State } from "../context.ts";
import { AnalyticsService } from "../services/mod.ts";

export class ErrorController extends Controller<State> {
  constructor(private readonly analytics: AnalyticsService) {
    super();
  }

  public async use(app: Application<State>): Promise<void> {
    app.use(this.handler.bind(this));
    await undefined;
  }

  private async handler(ctx: Context<State>, next: () => Promise<unknown>) {
    try {
      await next();
    } catch (err) {
      const { name, message, stack, ...rest } = err;
      const status = err.status ?? Status.InternalServerError;
      ctx.response.status = status;
      ctx.response.body = { ok: false, message };
      ctx.response.headers.set("Content-Type", "application/json");
      console.log({ name, message, stack, ...rest });
      this.analytics.send({
        event: "request",
        action: "error",
        data: {
          status: ctx.response.status,
          error: {
            name,
            message,
            stack,
            status,
            ...rest,
          },
        },
      });
    }
  }
}
