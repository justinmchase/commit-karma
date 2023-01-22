import {
  Application,
  Request,
  Response,
  Router,
  Status,
} from "../../deps/oak.ts";
import { Controller } from "./controller.ts";
import { ISerializable } from "../util/serializable.ts";
import { NotImplementedError } from "../errors/mod.ts";
import { InteractionKind, InteractionScore, State } from "../data/mod.ts";
import {
  GithubCheckSuiteActions,
  GithubEvents,
  GithubIssueCommentActions,
  GithubPullRequestReviewCommentActions,
  IGithubCheckSuiteEvent,
  IGithubIssueCommentEvent,
  IGithubPullRequestEvent,
  IGithubPullRequestReviewCommentEvent,
  IGithubPullRequestReviewEvent,
} from "../schema/mod.ts";
import { InstallationManager, InteractionManager } from "../managers/mod.ts";
import { GithubService } from "../services/mod.ts";
import {
  IGithubInstallationEvent,
  IGithubPullRequest,
} from "../schema/github.ts";
import { IGithubInstallationRepositoryEvent } from "../schema/github.ts";

export interface IWebhookControllerOptions {
  webhookPath?: string;
}

export class WebhookController extends Controller {
  constructor(
    private readonly installations: InstallationManager,
    private readonly interactions: InteractionManager,
    private readonly github: GithubService,
    private readonly webhookPath: string = "/webhook",
  ) {
    super();
  }

  public async use(app: Application): Promise<void> {
    const router = new Router();
    console.log(`webhook listening at path /${this.webhookPath}`);
    router.post(
      `/${this.webhookPath}`,
      async (ctx, _next) => await this.handler(ctx.request, ctx.response),
    );
    app.use(router.allowedMethods());
    app.use(router.routes());
    await undefined;
  }

  private async handler(req: Request, res: Response) {
    const githubEvent = req.headers.get("X-GitHub-Event");
    const body = req.body({ type: "json" });
    const data = await body.value as ISerializable;

    // verify the sha256 signature
    // X-Hub-Signature-256: sha256=a33f1336e1afdce5b4ad67dc0182b5393cc7631559df93636e0159a45a4bdf69
    this.github.verify(req);
    console.log(`event ${githubEvent} ${data.action}`);

    switch (githubEvent) {
      case GithubEvents.Installation:
        await this.handleInstallation(data as IGithubInstallationEvent);
        break;
      case GithubEvents.InstallationRepositories:
        await this.handleInstallationRepository(
          data as IGithubInstallationRepositoryEvent,
        );
        break;
      case GithubEvents.IssueComment:
        await this.handleIssueComment(data as IGithubIssueCommentEvent);
        break;
      case GithubEvents.PullRequest:
        await this.handlePullRequest(data as IGithubPullRequestEvent);
        break;
      case GithubEvents.PullRequestReview:
        await this.handlePullRequestReview(
          data as IGithubPullRequestReviewEvent,
        );
        break;
      case GithubEvents.PullRequestReviewComment:
        await this.handlePullRequestReviewComment(
          data as IGithubPullRequestReviewCommentEvent,
        );
        break;
      case GithubEvents.CheckSuite:
        await this.handleCheckSuite(data as IGithubCheckSuiteEvent);
        break;
      case GithubEvents.CheckRun:
        console.log(`event check_run ${data.action} skipped`);
        break;
      default:
        console.log("unknown github event:", githubEvent);
        throw new NotImplementedError(
          `${githubEvent} ${data.action} not implemented`,
        );
    }

    res.status = Status.OK;
    res.body = { ok: true };
    res.headers.set("Content-Type", "application/json");
  }

  private async handleInstallation(data: IGithubInstallationEvent) {
    const {
      installation: {
        id: installationId,
        target_id: targetId,
        target_type: targetType,
      },
      repositories,
    } = data as IGithubInstallationEvent;
    for (
      const { id: repositoryId, name: repositoryName } of repositories
    ) {
      const installation = {
        installationId,
        targetId,
        targetType,
        repositoryId,
        repositoryName,
      };
      await this.installations.install(installation);
      console.log(`installed ${repositoryName}`);
    }
  }

  private async handleInstallationRepository(
    data: IGithubInstallationRepositoryEvent,
  ) {
    const {
      installation: {
        id: installationId,
        target_id: targetId,
        target_type: targetType,
      },
    } = data;
    for (
      const { id: repositoryId, name: repositoryName } of data
        .repositories_added
    ) {
      const installation = {
        installationId,
        targetId,
        targetType,
        repositoryId,
        repositoryName,
      };
      await this.installations.install(installation);
      console.log(`installed ${repositoryName}`);
    }

    for (
      const { id: repositoryId, name: repositoryName } of data
        .repositories_removed
    ) {
      const installation = {
        installationId,
        targetId,
        repositoryId,
      };
      await this.installations.uninstall(installation);
      console.log(`installed ${repositoryName}`);
    }
  }

  private async handleIssueComment(data: IGithubIssueCommentEvent) {
    const {
      action,
      issue: { number, user: { issueUserId } },
      repository: { id: repositoryId },
      comment: {
        id: commentId,
        user: { id: commentUserId, login: commentUserLogin },
      },
    } = data;

    if (issueUserId === commentUserId) {
      // A user doesn't get karma points for commenting on their own issues.
      console.log(
        `event issue_comment same_user ${repositoryId} ${number} ${commentId} ${commentUserId}`,
      );
      return;
    }

    const kind = InteractionKind.Comment;
    const score = InteractionScore[kind];
    const state = action === GithubIssueCommentActions.Deleted
      ? State.Deleted
      : State.Active;
    console.log(
      `event issue_comment ${action} ${repositoryId} ${number} ${commentId} ${commentUserId} ${score}`,
    );
    await this.interactions.upsert({
      kind,
      state,
      repositoryId,
      number,
      id: commentId,
      userId: commentUserId,
      userLogin: commentUserLogin,
      score,
    });
  }

  private async handlePullRequest(data: IGithubPullRequestEvent) {
    // regardless of action...
    const {
      action,
      installation: { id: installationId },
      repository: {
        id: repositoryId,
        name: repositoryName,
        owner: { login: repositoryOwner },
      },
      pull_request: {
        id: pullRequestId,
        number: number,
        user: { id: userId, login: userLogin },
        head: { sha: commit },
      },
    } = data;

    const kind = InteractionKind.PullRequest;
    const score = InteractionScore[kind];
    console.log(
      `event pull_request ${action} ${repositoryId} ${number} ${pullRequestId} ${userId} ${score}`,
    );
    await this.interactions.upsert({
      kind,
      state: State.Active,
      repositoryId,
      number,
      id: pullRequestId,
      userId: userId,
      userLogin: userLogin,
      score,
    });

    const karma = await this.interactions.calculateKarma(userId);
    await this.github.createCheckRun({
      installationId,
      userLogin,
      repositoryName,
      repositoryOwner,
      commit,
      karma,
    });
  }

  private async handlePullRequestReview(data: IGithubPullRequestReviewEvent) {
    // regardless of action...
    const {
      action,
      repository: { id: repositoryId },
      pull_request: {
        number,
        user: {
          id: pullRequestUserId,
        },
      },
      review: {
        id: reviewId,
        user: {
          id: reviewUserId,
          login: reviewUserLogin,
        },
      },
    } = data;

    if (pullRequestUserId === reviewUserId) {
      // A user doesn't get karma points for reviewing their own PRs (should never happen, github prevents it).
      console.log(
        `event pull_request_review same_user ${repositoryId} ${number} ${reviewId} ${reviewUserId}`,
      );
      return;
    }

    const kind = InteractionKind.Review;
    const score = InteractionScore[kind];
    console.log(
      `event pull_request ${action} ${repositoryId} ${number} ${reviewId} ${reviewUserId} ${score}`,
    );
    await this.interactions.upsert({
      kind,
      state: State.Active,
      repositoryId,
      number,
      id: reviewId,
      userId: reviewUserId,
      userLogin: reviewUserLogin,
      score,
    });
  }

  private async handlePullRequestReviewComment(
    data: IGithubPullRequestReviewCommentEvent,
  ) {
    // regardless of action...
    const {
      action,
      repository: { id: repositoryId },
      pull_request: { number, user: { id: pullRequestUserId } },
      comment: {
        id: commentId,
        user: { id: commentUserId, login: commentUserLogin },
      },
    } = data;

    if (pullRequestUserId === commentUserId) {
      // A user doesn't get karma points for reviewing their own PRs (should never happen, github prevents it).
      console.log(
        `event pull_request_review same_user ${repositoryId} ${number} ${commentId} ${commentUserId}`,
      );
      return;
    }

    const kind = InteractionKind.Comment;
    const score = InteractionScore[kind];
    const state = action === GithubPullRequestReviewCommentActions.Deleted
      ? State.Deleted
      : State.Active;
    console.log(
      `event pull_request ${action} ${repositoryId} ${number} ${commentId} ${commentUserId} ${score}`,
    );
    await this.interactions.upsert({
      kind,
      state,
      repositoryId,
      number,
      id: commentId,
      userId: commentUserId,
      userLogin: commentUserLogin,
      score,
    });
  }

  private async handleCheckSuite(data: IGithubCheckSuiteEvent) {
    const {
      action,
      installation: { id: installationId },
      check_suite: { pull_requests },
      repository: { name: repositoryName, owner: repositoryOwner },
    } = data;
    if (!pull_requests.length) {
      console.log(
        `event check_suite ${action} no_prs ${installationId} ${repositoryOwner}/${repositoryName}`,
      );
      return;
    }

    for (const pullRequest of pull_requests) {
      const { head: { sha: commit } } = pullRequest;
      switch (action) {
        case GithubCheckSuiteActions.Requested:
        case GithubCheckSuiteActions.Rerequested:
          console.log(
            `event check_suite ${action} check_run_create ${installationId} ${repositoryOwner}/${repositoryName} ${commit}`,
          );
          await this.handleCheckSuiteRequested(data, pullRequest);
          break;
        case GithubCheckSuiteActions.Completed:
        default:
          console.log(
            `event check_suite ${action} skipped ${installationId} ${repositoryOwner}/${repositoryName} ${commit}`,
          );
          break;
      }
    }
  }

  private async handleCheckSuiteRequested(
    data: IGithubCheckSuiteEvent,
    pr: IGithubPullRequest,
  ) {
    const { id: pullRequestId, head: { sha: commit } } = pr;
    const {
      installation: { id: installationId },
      repository: {
        name: repositoryName,
        owner: { login: repositoryOwner },
      },
    } = data;

    const pullRequest = await this.interactions.searchOne({
      kind: InteractionKind.PullRequest,
      id: pullRequestId,
    });
    const { userId, userLogin } = pullRequest;
    const karma = await this.interactions.calculateKarma(userId);
    await this.github.createCheckRun({
      installationId,
      userLogin,
      repositoryName,
      repositoryOwner,
      commit,
      karma,
    });
  }
}
