import { Application, Status, Router, Request, Response } from '../../deps/oak.ts';
import { Controller } from "./controller.ts";
import { ISerializable } from "../util/serializable.ts"
import {
  State,
  AccountType,
} from "../data/mod.ts"
import {
  GithubEvents,
  GithubInstallationActions,
  GithubInstallationRepositoryActions,
  IGithubInstallationEvent,
  IGithubInstallationRepositoryEvent,
} from "../schema/github.ts"
import {
  IInstallationEvent,
  assertInstallationEvent,
} from "../schema/installation.schema.ts"
import {
  IInstallationRepositoryEvent,
  assertInstallationRepositoryEvent,
} from "../schema/installationRepository.schema.ts"
import { InstallationManager } from "../managers/installation.manager.ts"


export class WebhookController extends Controller {

  constructor(private readonly installations: InstallationManager) {
    super()
  }

  public async use(app: Application): Promise<void> {
    const router = new Router()

    // todo: make the actual route a secret route
    router.post('/webhook', async (ctx, _next) => await this.handler(ctx.request, ctx.response));
    app.use(router.allowedMethods());
    app.use(router.routes());
    await undefined;
  }

  private async handler(req: Request, res: Response) {
    try {
      const githubEvent = req.headers.get("X-GitHub-Event")
      const body = req.body({ type: "json" })
      const data = await body.value as ISerializable

      // todo verify the sha256 signature
      // X-Hub-Signature-256: sha256=a33f1336e1afdce5b4ad67dc0182b5393cc7631559df93636e0159a45a4bdf69

      switch (githubEvent) {
        case GithubEvents.Installation:
          await this.handleInstallation(data);
          break;
        case GithubEvents.InstallationRepositories:
          await this.handleInstallationRepositories(data);
          break;
        default:
          console.log('unknown github event:', githubEvent)
          console.log(req)
          break;
      }
    } catch (err) {
      console.log({ ...err }, err)
    }

    res.status = Status.OK;
    res.body = { ok: true };
    res.headers.set('Content-Type', 'application/json');
  }

  private async handleInstallation(data: ISerializable) {
    const installation = assertInstallationEvent(data as IGithubInstallationEvent)
    switch (installation.action) {
      case GithubInstallationActions.Created:
        return await this.handleInstallationCreated(installation);
      case GithubInstallationActions.Deleted:
        return await this.handleInstallationDeleted(installation);
    }
  }

  private async handleInstallationRepositories(data: ISerializable) {
    const installation = assertInstallationRepositoryEvent(data as IGithubInstallationRepositoryEvent)
    switch (installation.action) {
      case GithubInstallationRepositoryActions.Added:
        return await this.handleInstallationRepositoryAdded(installation);
      case GithubInstallationRepositoryActions.Removed:
        return await this.handleInstallationRepositoryRemoved(installation);
    }
  }

  private async handleInstallationCreated(installation: IInstallationEvent) {
    const { id, targetId, type, repositories } = installation
    for (const repositoryId of repositories) {
      console.log(`event installation created ${id} ${targetId} ${repositoryId}`)
      const existingInstallation = await this.installations.byRepositoryId(repositoryId)
      if (existingInstallation) {
        const { _id } = existingInstallation
        await this.installations.setState(existingInstallation, State.Active)
        console.log(`data installation updated ${_id} active`)
      } else {
        const created = await this.installations.create({
          installationId: id,
          targetId,
          targetType: type.toLowerCase() as AccountType,
          repositoryId
        })
        const { _id } = created
        console.log(`data installation created ${_id} ${id} ${targetId} ${repositoryId} active`)
      }
    }
  }

  private async handleInstallationDeleted(installation: IInstallationEvent) {
    const { id, targetId, repositories } = installation
    for (const repositoryId of repositories) {
      console.log(`event installation delete ${id} ${targetId} ${repositoryId}`)
      const existingInstallation = await this.installations.byRepositoryId(repositoryId)
      if (existingInstallation) {
        const { _id } = existingInstallation
        await this.installations.setState(existingInstallation, State.Deleted)
        console.log(`data installation updated ${_id} deleted`)
      } else {
        console.log(`data installation unknown ${id} ${targetId} ${repositoryId}`)
      }
    }
  }

  private async handleInstallationRepositoryAdded(installation: IInstallationRepositoryEvent) {
    const { id, targetId, type, repositories } = installation
    for (const repositoryId of repositories) {
      console.log(`event installation repository added ${id} ${targetId} ${repositoryId}`)
      const existingInstallation = await this.installations.byRepositoryId(repositoryId)
      if (existingInstallation) {
        const { _id } = existingInstallation
        await this.installations.setState(existingInstallation, State.Active)
        console.log(`data installation updated ${_id} active`)
      } else {
        const created = await this.installations.create({
          installationId: id,
          targetId,
          targetType: type.toLowerCase() as AccountType,
          repositoryId
        })
        const { _id } = created
        console.log(`data installation created ${_id} ${id} ${targetId} ${repositoryId} active`)
      }
    }
  }

  private async handleInstallationRepositoryRemoved(installation: IInstallationRepositoryEvent) {
    const { id, targetId, repositories } = installation
    for (const repositoryId of repositories) {
      console.log(`event installation repository removed ${id} ${targetId} ${repositoryId}`)
      const existingInstallation = await this.installations.byRepositoryId(repositoryId)
      if (existingInstallation) {
        const { _id } = existingInstallation
        await this.installations.setState(existingInstallation, State.Deleted)
        console.log(`data installation updated ${_id} deleted`)
      } else {
        console.log(`data installation unknown ${id} ${targetId} ${repositoryId}`)
      }
    }
  }

}
