import { Application, Status, Router, Request, Response } from '../../deps/oak.ts';
import { Controller } from "./controller.ts";

export class WebhookController extends Controller {

  public async use(app: Application): Promise<void> {
    const router = new Router()
    router.post('/webhook', async (ctx, _next) => await this.handler(ctx.request, ctx.response));
    app.use(router.allowedMethods());
    app.use(router.routes());
    await undefined;
  }

  private async handler(req: Request, res: Response) {
    console.log(req)
    res.status = Status.OK;
    res.body = { ok: true };
    res.headers.set('Content-Type', 'application/json');
    await undefined;
  }

}
