import { Application, Context } from "../../deps/oak.ts";
import { IContext } from "./context.ts";
import { Controller } from "./controller.ts";

export class LogController extends Controller {
  public async use(app: Application<IContext>): Promise<void> {
    app.use(this.handler.bind(this));
    await undefined;
  }

  private async handler(ctx: Context, next: () => Promise<unknown>) {
    const start = new Date().valueOf();
    const { request: { ip, hasBody, method, url } } = ctx;
    try {
      await next();
    } finally {
      const end = new Date().valueOf();
      const t = `${end - start}ms`;
      const { response: { status } } = ctx;
      console.log(
        `${status} ${method} ${url} ${JSON.stringify({ t, ip, hasBody })}`,
      );
    }
  }
}
