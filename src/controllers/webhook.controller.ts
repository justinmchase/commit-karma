import {
  Application,
  Request,
  Response,
  Router,
  Status,
} from "../../deps/oak.ts";
import { Controller, ILoggingService } from "../../deps/grove.ts";
import { State } from "../context.ts";
import { ModelState } from "../data/state.ts";
import { ISerializable } from "../util/serializable.ts";
import { NotImplementedError } from "../errors/mod.ts";
import { InteractionKind, InteractionScore } from "../data/mod.ts";
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
  IGithubMarketplacePurchaseEvent,
  IGithubPullRequest,
} from "../schema/github.ts";
import { IGithubInstallationRepositoryEvent } from "../schema/github.ts";
import { CreateInteractionInput } from "../managers/interaction.manager.ts";

export interface IWebhookControllerOptions {
  webhookPath?: string;
}

export class WebhookController extends Controller<State> {
  constructor(
    private readonly logging: ILoggingService,
    private readonly installations: InstallationManager,
    private readonly interactions: InteractionManager,
    private readonly github: GithubService,
    private readonly webhookPath: string = "/webhook",
  ) {
    super();
  }

  public async use(app: Application<State>): Promise<void> {
    const router = new Router();
    const webhookPath = this.webhookPath;
    this.logging.info(
      "webhook",
      `webhook listening at path ${webhookPath}`,
      { webhookPath },
    );
    router.post(
      webhookPath,
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
    this.logging.info(
      `github_event`,
      `event ${githubEvent} ${data.action}`,
      { githubEvent, action: data.action },
    );

    switch (githubEvent) {
      case GithubEvents.MarketplacePurchase:
        await this.handleMarketplacePurchase(
          data as IGithubMarketplacePurchaseEvent,
        );
        break;
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
        break;
      default:
        throw new NotImplementedError(
          `${githubEvent} ${data.action} not implemented`,
        );
    }

    res.status = Status.OK;
    res.body = { ok: true };
    res.headers.set("Content-Type", "application/json");
  }

  private async handleMarketplacePurchase(
    data: IGithubMarketplacePurchaseEvent,
  ) {
    const {
      action,
      marketplace_purchase: {
        account: {
          id: accountId,
          login: accountLogin,
        },
        plan: {
          id: planId,
          name: planName,
        },
      },
    } = data;
    await this.logging.info(
      `github_marketplace_purchase`,
      `marketplace purchased ${data}`,
      {
        action,
        accountId,
        accountLogin,
        planId,
        planName,
      },
    );
  }

  private async handleInstallation(data: IGithubInstallationEvent) {
    const {
      action,
      installation: {
        id: installationId,
        target_id: targetId,
        target_type: targetType,
      },
      repositories,
    } = data as IGithubInstallationEvent;
    for (
      const { id: repositoryId, full_name: repositoryName } of repositories
    ) {
      const installation = {
        installationId,
        targetId,
        targetType,
        repositoryId,
        repositoryName,
      };
      await this.installations.install(installation);
      await this.logging.info(
        "github_installation",
        `installation ${action} ${repositoryName}`,
        {
          installationId,
          targetId,
          targetType,
          repositoryId,
          repositoryName,
        },
      );
    }
  }

  private async handleInstallationRepository(
    data: IGithubInstallationRepositoryEvent,
  ) {
    const {
      action,
      installation: {
        id: installationId,
        target_id: targetId,
        target_type: targetType,
      },
    } = data;
    for (
      const { id: repositoryId, full_name: repositoryName } of data
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
      await this.logging.info(
        "github_installation_repository",
        `installation repository ${action} ${repositoryName}`,
        {
          installationId,
          targetId,
          targetType,
          repositoryId,
          repositoryName,
        },
      );
    }

    for (
      const { id: repositoryId, full_name: repositoryName } of data
        .repositories_removed
    ) {
      const installation = {
        installationId,
        targetId,
        repositoryId,
      };
      await this.installations.uninstall(installation);
      await this.logging.info(
        "github_installation",
        `installation ${action} ${repositoryName}`,
        {
          installationId,
          targetId,
          targetType,
          repositoryId,
          repositoryName,
        },
      );
    }
  }

  private async handleIssueComment(data: IGithubIssueCommentEvent) {
    const {
      action,
      issue: { number, user: { issueUserId } },
      repository: { id: repositoryId, full_name: repositoryName },
      comment: {
        id: commentId,
        user: { id: commentUserId, login: commentUserLogin },
      },
    } = data;

    if (issueUserId === commentUserId) {
      // A user doesn't get karma points for commenting on their own issues.
      await this.logging.debug(
        "github_issue_comment_same_user",
        `issue_comment same_user ${action} ${number} ${repositoryName}`,
        {
          action,
          number,
          commentId,
          commentUserId,
          repositoryId,
          repositoryName,
        },
      );
      return;
    }

    const kind = InteractionKind.Comment;
    const score = InteractionScore[kind];
    const state = action === GithubIssueCommentActions.Deleted
      ? ModelState.Deleted
      : ModelState.Active;
    const interaction: CreateInteractionInput = {
      kind,
      state,
      repositoryId,
      repositoryName,
      number,
      id: commentId,
      userId: commentUserId,
      userLogin: commentUserLogin,
      score,
    };
    await this.interactions.upsert(interaction);
    await this.logging.info(
      "github_issue_comment",
      `issue_comment ${action} ${number} ${commentUserLogin} ${score} ${repositoryName}`,
      {
        action,
        number,
        commentId,
        commentUserId,
        commentUserLogin,
        repositoryId,
        repositoryName,
        score,
      },
    );
  }

  private async handlePullRequest(data: IGithubPullRequestEvent) {
    // regardless of action...
    const {
      action,
      installation: { id: installationId },
      repository: {
        id: repositoryId,
        full_name: repositoryName,
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
    const interaction = {
      kind,
      state: ModelState.Active,
      repositoryId,
      repositoryName,
      number,
      id: pullRequestId,
      userId: userId,
      userLogin: userLogin,
      score,
    };
    await this.interactions.upsert(interaction);

    const karma = await this.interactions.calculateKarma(userId);
    await this.github.createCheckRun({
      installationId,
      userLogin,
      repositoryName,
      commit,
      karma,
    });
    await this.logging.info(
      "github_pull_request",
      `pull_request ${action} ${number} ${userLogin} ${score}/${karma} ${repositoryName}`,
      {
        action,
        number,
        userId,
        userLogin,
        repositoryId,
        repositoryName,
        score,
        karma,
      },
    );
  }

  private async handlePullRequestReview(data: IGithubPullRequestReviewEvent) {
    // regardless of action...
    const {
      action,
      repository: { id: repositoryId, full_name: repositoryName },
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
      await this.logging.debug(
        "github_pull_request_review_same_user",
        `pull_request_review same_user ${action} ${number} ${reviewUserLogin} ${repositoryName}`,
        {
          action,
          number,
          reviewId,
          reviewUserId,
          reviewUserLogin,
          repositoryId,
          repositoryName,
        },
      );
      return;
    }

    const kind = InteractionKind.Review;
    const score = InteractionScore[kind];
    const interaction = {
      kind,
      state: ModelState.Active,
      repositoryId,
      repositoryName,
      number,
      id: reviewId,
      userId: reviewUserId,
      userLogin: reviewUserLogin,
      score,
    };
    await this.interactions.upsert(interaction);
    await this.logging.info(
      "github_pull_request_review",
      `pull_request_review ${action} ${number} ${reviewUserLogin} ${score} ${repositoryName}`,
      {
        action,
        number,
        reviewId,
        reviewUserId,
        reviewUserLogin,
        repositoryId,
        repositoryName,
        score,
      },
    );
  }

  private async handlePullRequestReviewComment(
    data: IGithubPullRequestReviewCommentEvent,
  ) {
    // regardless of action...
    const {
      action,
      repository: { id: repositoryId, full_name: repositoryName },
      pull_request: { number, user: { id: pullRequestUserId } },
      comment: {
        id: commentId,
        user: { id: commentUserId, login: commentUserLogin },
      },
    } = data;

    if (pullRequestUserId === commentUserId) {
      // A user doesn't get karma points for reviewing their own PRs (should never happen, github prevents it).
      await this.logging.debug(
        "github_pull_request_review_comment_same_user",
        `pull_request_review_comment same_user ${action} ${number} ${commentUserLogin} ${repositoryName}`,
        {
          action,
          number,
          commentId,
          commentUserId,
          commentUserLogin,
          repositoryId,
          repositoryName,
        },
      );
      return;
    }

    const kind = InteractionKind.Comment;
    const score = InteractionScore[kind];
    const state = action === GithubPullRequestReviewCommentActions.Deleted
      ? ModelState.Deleted
      : ModelState.Active;
    const interaction = {
      kind,
      state,
      repositoryId,
      repositoryName,
      number,
      id: commentId,
      userId: commentUserId,
      userLogin: commentUserLogin,
      score,
    };
    await this.interactions.upsert(interaction);
    await this.logging.info(
      "github_pull_request_review_comment",
      `pull_request_review_comment ${action} ${number} ${commentUserLogin} ${score} ${repositoryName}`,
      {
        action,
        number,
        commentId,
        commentUserId,
        commentUserLogin,
        repositoryId,
        repositoryName,
        score,
      },
    );
  }

  private async handleCheckSuite(data: IGithubCheckSuiteEvent) {
    const {
      action,
      check_suite: { pull_requests },
    } = data;
    if (!pull_requests.length) {
      return;
    }

    for (const pullRequest of pull_requests) {
      switch (action) {
        case GithubCheckSuiteActions.Requested:
        case GithubCheckSuiteActions.Rerequested:
          await this.handleCheckSuiteRequested(data, pullRequest);
          break;
        case GithubCheckSuiteActions.Completed:
        default:
          break;
      }
    }
  }

  private async handleCheckSuiteRequested(
    data: IGithubCheckSuiteEvent,
    pr: IGithubPullRequest,
  ) {
    const {
      number,
      head: { sha: commit },
      user: {
        id: userId,
        login: userLogin,
      },
    } = pr;
    const {
      action,
      installation: { id: installationId },
      repository: {
        id: repositoryId,
        full_name: repositoryName,
      },
    } = data;
    const karma = await this.interactions.calculateKarma(userId);
    const checkRun = {
      installationId,
      userLogin,
      repositoryName,
      commit,
      karma,
    };
    await this.github.createCheckRun(checkRun);
    await this.logging.info(
      "github_check_suite",
      `check_suite ${action} ${number} ${commit} ${userLogin} ${repositoryName}`,
      {
        action,
        number,
        commit,
        userId,
        userLogin,
        repositoryId,
        repositoryName,
        karma,
      },
    );
  }
}
