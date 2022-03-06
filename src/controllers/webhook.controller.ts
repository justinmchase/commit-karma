import { Application, Status, Router, Request, Response } from '../../deps/oak.ts';
import { Controller } from "./controller.ts";
import { ISerializable } from "../util/serializable.ts"
import { NotImplementedError } from "../errors/mod.ts"
import {
  State,
  InteractionKind,
  InteractionScore,
} from "../data/mod.ts"
import {
  GithubEvents,
  GithubCheckSuiteActions,
  GithubIssueCommentActions,
  GithubPullRequestReviewCommentActions,
  IGithubIssueCommentEvent,
  IGithubPullRequestEvent,
  IGithubPullRequestReviewEvent,
  IGithubPullRequestReviewCommentEvent,
  IGithubCheckSuiteEvent,
  ICheckSuiteEvent,
  assertCheckSuiteEvent,
  assertIssueCommentEvent,
  assertPullRequestEvent,
  assertPullRequestReviewEvent,
  assertPullRequestReviewCommentEvent,
} from "../schema/mod.ts"
import {
  InstallationManager,
  InteractionManager,
} from "../managers/mod.ts"
import {
  GithubService
} from "../services/mod.ts"


export class WebhookController extends Controller {

  constructor(
    private readonly installations: InstallationManager,
    private readonly interactions: InteractionManager,
    private readonly github: GithubService,
  ) {
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
        case GithubEvents.InstallationRepositories:
          // ignore
          break;
        case GithubEvents.IssueComment:
          await this.handleIssueComment(data);
          break;
        case GithubEvents.PullRequest:
          await this.handlePullRequest(data);
          break;
        case GithubEvents.PullRequestReview:
          await this.handlePullRequestReview(data);
          break;
        case GithubEvents.PullRequestReviewComment:
          await this.handlePullRequestReviewComment(data);
          break;
        case GithubEvents.CheckSuite:
          await this.handleCheckSuite(data);
          break;
        case GithubEvents.CheckRun:
          console.log(`event check_run ${data.action} skipped`);
          break;
        default:
          console.log('unknown github event:', githubEvent)
          throw new NotImplementedError(`${githubEvent} ${data.action} not implemented`)
      }
    } catch (err) {
      console.log({ ...err }, err)
      res.status = err.status ?? Status.InternalServerError;
      res.body = { ok: false, message: err.message };
      res.headers.set('Content-Type', 'application/json');
      return;
    }

    res.status = Status.OK;
    res.body = { ok: true };
    res.headers.set('Content-Type', 'application/json');
  }

  private async handleIssueComment(data: ISerializable) {
    const issueComment = await assertIssueCommentEvent(data as IGithubIssueCommentEvent)
    const {
      action,
      number,
      repositoryId,
      commentId,
      commentUserId,
      issueUserId,
      issueUserLogin,
    } = issueComment

    if (issueUserId === commentUserId) {
      // A user doesn't get karma points for commenting on their own issues.
      console.log(`event issue_comment same_user ${repositoryId} ${number} ${commentId} ${commentUserId}`)
      return;
    }

    const kind = InteractionKind.Comment;
    const score = InteractionScore[kind];
    const state = action === GithubIssueCommentActions.Deleted
      ? State.Deleted
      : State.Active;
    console.log(`event issue_comment ${action} ${repositoryId} ${number} ${commentId} ${commentUserId} ${score}`)
    await this.interactions.upsert({
      kind,
      state,
      repositoryId,
      number,
      id: commentId,
      userId: issueUserId,
      userLogin: issueUserLogin,
      score
    })
  }

  private async handlePullRequest(data: ISerializable) {
    const pullRequest = await assertPullRequestEvent(data as IGithubPullRequestEvent)
    // regardless of action...
    const {
      action,
      repositoryId,
      pullRequestId,
      number,
      userId,
      userLogin,
    } = pullRequest

    const kind = InteractionKind.PullRequest;
    const score = InteractionScore[kind];
    console.log(`event pull_request ${action} ${repositoryId} ${number} ${pullRequestId} ${userId} ${score}`)
    await this.interactions.upsert({
      kind,
      state: State.Active,
      repositoryId,
      number,
      id: pullRequestId,
      userId: userId,
      userLogin: userLogin,
      score
    })
  }

  private async handlePullRequestReview(data: ISerializable) {
    const pullRequest = await assertPullRequestReviewEvent(data as IGithubPullRequestReviewEvent)
    // regardless of action...
    const {
      action,
      repositoryId,
      number,
      // pullRequestId,
      pullRequestUserId,
      reviewId,
      reviewUserId,
      reviewUserLogin,
    } = pullRequest

    if (pullRequestUserId === reviewUserId) {
      // A user doesn't get karma points for reviewing their own PRs (should never happen, github prevents it).
      console.log(`event pull_request_review same_user ${repositoryId} ${number} ${reviewId} ${reviewUserId}`)
      return;
    }

    const kind = InteractionKind.Review;
    const score = InteractionScore[kind];
    console.log(`event pull_request ${action} ${repositoryId} ${number} ${reviewId} ${reviewUserId} ${score}`)
    await this.interactions.upsert({
      kind,
      state: State.Active,
      repositoryId,
      number,
      id: reviewId,
      userId: reviewUserId,
      userLogin: reviewUserLogin,
      score
    })
  }

  private async handlePullRequestReviewComment(data: ISerializable) {
    const pullRequest = await assertPullRequestReviewCommentEvent(data as IGithubPullRequestReviewCommentEvent)
    // regardless of action...
    const {
      action,
      repositoryId,
      number,
      // pullRequestId,
      pullRequestUserId,
      commentId,
      commentUserId,
      commentUserLogin,
    } = pullRequest

    if (pullRequestUserId === commentUserId) {
      // A user doesn't get karma points for reviewing their own PRs (should never happen, github prevents it).
      console.log(`event pull_request_review same_user ${repositoryId} ${number} ${commentId} ${commentUserId}`)
      return;
    }

    const kind = InteractionKind.Comment;
    const score = InteractionScore[kind];
    const state = action === GithubPullRequestReviewCommentActions.Deleted
      ? State.Deleted
      : State.Active;
    console.log(`event pull_request ${action} ${repositoryId} ${number} ${commentId} ${commentUserId} ${score}`)
    await this.interactions.upsert({
      kind,
      state,
      repositoryId,
      number,
      id: commentId,
      userId: commentUserId,
      userLogin: commentUserLogin,
      score
    })
  }

  private async handleCheckSuite(data: ISerializable) {
    const checkSuite = await assertCheckSuiteEvent(data as IGithubCheckSuiteEvent)

    const {
      action,
      installationId,
      repositoryName,
      repositoryOwner,
      commit
    } = checkSuite

    switch (action) {
      case GithubCheckSuiteActions.Requested:
      case GithubCheckSuiteActions.Rerequested:
        console.log(`event check_suite ${action} check_run_create ${installationId} ${repositoryOwner}/${repositoryName} ${commit}`)
        await this.handleCheckSuiteRequested(checkSuite);
        break;
      case GithubCheckSuiteActions.Completed:
      default:
        console.log(`event check_suite ${action} skipped ${installationId} ${repositoryOwner}/${repositoryName} ${commit}`)
        break;
    }
  }

  private async handleCheckSuiteRequested(checkSuite: ICheckSuiteEvent) {
    const {
      installationId,
      pullRequestId,
      repositoryName,
      repositoryOwner,
      commit
    } = checkSuite
    const pullRequest = await this.interactions.searchOne({
      kind: InteractionKind.PullRequest,
      id: pullRequestId
    })
    const { userId, userLogin } = pullRequest
    const karma = await this.interactions.calculateKarma(userId);
    await this.github.createCheckRun({
      installationId,
      userLogin,
      repositoryName,
      repositoryOwner,
      commit,
      karma
    });
  }
}
