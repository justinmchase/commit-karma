import { Application, Context, Status } from "../../deps/oak.ts";
import { IContext } from "./context.ts";
import { Controller } from "./controller.ts";

export class ErrorController extends Controller {
  public async use(app: Application): Promise<void> {
    app.use(this.handler.bind(this));
    await undefined;
  }

  private async handler(ctx: Context<IContext>, next: () => Promise<unknown>) {
    try {
      await next();
    } catch (err) {
      console.log({ ...err }, err);
      ctx.response.status = err.status ?? Status.InternalServerError;
      ctx.response.body = { ok: false, message: err.message };
      ctx.response.headers.set("Content-Type", "application/json");
    }
  }
}
