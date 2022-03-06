import { Application, Context } from "../../deps/oak.ts";
import { IContext } from "./context.ts";
import { Controller } from "./controller.ts";
import { NotFoundError } from "../errors/mod.ts";

export class NotFoundController extends Controller {
  public async use(app: Application<IContext>): Promise<void> {
    app.use(this.handler.bind(this));
    await undefined;
  }

  private async handler(ctx: Context<IContext>) {
    if (ctx.request.method === "GET" && ctx.state.isHtml === true) {
      ctx.response.redirect("https://justinmchase.github.io/commit-karma/");
    } else {
      throw new NotFoundError("url", ctx.request.url.toString());
    }

    await undefined;
  }
}
