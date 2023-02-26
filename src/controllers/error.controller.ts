import { Controller, ILoggingService } from "../../deps/grove.ts";
import { Application, Context, Status } from "../../deps/oak.ts";
import { State } from "../context.ts";

export class ErrorController extends Controller<State> {
  constructor(private readonly logging: ILoggingService) {
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
      const { message } = err;
      const status = err.status ?? Status.InternalServerError;
      ctx.response.status = status;
      ctx.response.body = { ok: false, message };
      ctx.response.headers.set("Content-Type", "application/json");
      this.logging.error(
        "request_error",
        message,
        err,
      );
    }
  }
}
