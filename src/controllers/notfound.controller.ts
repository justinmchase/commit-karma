import { Controller } from "#grove/mod.ts";
import { Application, Context } from "../../deps/oak.ts";
import { State } from "../context.ts";
import { NotFoundError } from "../errors/mod.ts";

export class NotFoundController extends Controller<State> {
  public async use(app: Application<State>): Promise<void> {
    app.use(this.handler.bind(this));
    await undefined;
  }

  private async handler(ctx: Context<State>) {
    if (ctx.request.method === "GET" && ctx.state.isHtml === true) {
      ctx.response.redirect("https://justinmchase.github.io/commit-karma/");
    } else {
      throw new NotFoundError("url", ctx.request.url.toString());
    }

    await undefined;
  }
}
