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
  IGithubInstallationEvent,
  IInstallationEvent,
  assertInstallationEvent,
} from "../schema/github.ts"
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

  private async handleInstallationCreated(installation: IInstallationEvent) {
    const { id, targetId, type, repositories } = installation
    for (const repositoryId of repositories) {
      console.log(`event installation created ${id} ${targetId} ${repositoryId}`)
      const existingInstallation = await this.installations.byRepositoryId(repositoryId)
      if (existingInstallation) {
        const { _id } = existingInstallation
        await this.installations.update(existingInstallation, State.Active)
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
        await this.installations.update(existingInstallation, State.Deleted)
        console.log(`data installation updated ${_id} deleted`)
      } else {
        console.log(`data installation unknown ${id} ${targetId} ${repositoryId}`)
      }
    }
  }
}

// {
//   "action": "created",
//   "installation": {
//     "id": 23211748,
//     "account": {
//       "login": "justinmchase",
//       "id": 10974,
//       "node_id": "MDQ6VXNlcjEwOTc0",
//       "avatar_url": "https://avatars.githubusercontent.com/u/10974?v=4",
//       "gravatar_id": "",
//       "url": "https://api.github.com/users/justinmchase",
//       "html_url": "https://github.com/justinmchase",
//       "followers_url": "https://api.github.com/users/justinmchase/followers",
//       "following_url": "https://api.github.com/users/justinmchase/following{/other_user}",
//       "gists_url": "https://api.github.com/users/justinmchase/gists{/gist_id}",
//       "starred_url": "https://api.github.com/users/justinmchase/starred{/owner}{/repo}",
//       "subscriptions_url": "https://api.github.com/users/justinmchase/subscriptions",
//       "organizations_url": "https://api.github.com/users/justinmchase/orgs",
//       "repos_url": "https://api.github.com/users/justinmchase/repos",
//       "events_url": "https://api.github.com/users/justinmchase/events{/privacy}",
//       "received_events_url": "https://api.github.com/users/justinmchase/received_events",
//       "type": "User",
//       "site_admin": false
//     },
//     "repository_selection": "selected",
//     "access_tokens_url": "https://api.github.com/app/installations/23211748/access_tokens",
//     "repositories_url": "https://api.github.com/installation/repositories",
//     "html_url": "https://github.com/settings/installations/23211748",
//     "app_id": 37724,
//     "app_slug": "commit-karma",
//     "target_id": 10974,
//     "target_type": "User",
//     "permissions": {
//       "checks": "write",
//       "issues": "read",
//       "metadata": "read",
//       "pull_requests": "read"
//     },
//     "events": [
//       "check_run",
//       "check_suite",
//       "pull_request",
//       "pull_request_review",
//       "pull_request_review_comment"
//     ],
//     "created_at": "2022-02-12T14:17:31.000-06:00",
//     "updated_at": "2022-02-12T14:17:31.000-06:00",
//     "single_file_name": null,
//     "has_multiple_single_files": false,
//     "single_file_paths": [

//     ],
//     "suspended_by": null,
//     "suspended_at": null
//   },
//   "repositories": [
//     {
//       "id": 201168994,
//       "node_id": "MDEwOlJlcG9zaXRvcnkyMDExNjg5OTQ=",
//       "name": "commit-karma",
//       "full_name": "justinmchase/commit-karma",
//       "private": false
//     }
//   ],
//   "requester": null,
//   "sender": {
//     "login": "justinmchase",
//     "id": 10974,
//     "node_id": "MDQ6VXNlcjEwOTc0",
//     "avatar_url": "https://avatars.githubusercontent.com/u/10974?v=4",
//     "gravatar_id": "",
//     "url": "https://api.github.com/users/justinmchase",
//     "html_url": "https://github.com/justinmchase",
//     "followers_url": "https://api.github.com/users/justinmchase/followers",
//     "following_url": "https://api.github.com/users/justinmchase/following{/other_user}",
//     "gists_url": "https://api.github.com/users/justinmchase/gists{/gist_id}",
//     "starred_url": "https://api.github.com/users/justinmchase/starred{/owner}{/repo}",
//     "subscriptions_url": "https://api.github.com/users/justinmchase/subscriptions",
//     "organizations_url": "https://api.github.com/users/justinmchase/orgs",
//     "repos_url": "https://api.github.com/users/justinmchase/repos",
//     "events_url": "https://api.github.com/users/justinmchase/events{/privacy}",
//     "received_events_url": "https://api.github.com/users/justinmchase/received_events",
//     "type": "User",
//     "site_admin": false
//   }
// }
