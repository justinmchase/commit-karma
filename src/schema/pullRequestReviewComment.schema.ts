import { Schema, validate } from "../../deps/jtd.ts";
import { SchemaValidationError } from "../errors/mod.ts";
import {
  GithubPullRequestReviewCommentActions,
  IGithubPullRequestReviewCommentEvent,
} from "./github.ts";

const PullRequestReviewCommentEventSchema = {
  properties: {
    action: { type: "string" },
    repositoryId: { type: "number" },
    number: { type: "number" },
    pullRequestId: { type: "number" },
    pullRequestUserId: { type: "number" },
    commentId: { type: "number" },
    commentUserId: { type: "number" },
    commentUserLogin: { type: "string" },
  }
} as Schema;

export interface IPullRequestReviewCommentEvent {
  action: GithubPullRequestReviewCommentActions
  repositoryId: number
  number: number
  pullRequestId: number
  pullRequestUserId: number
  commentId: number
  commentUserId: number
  commentUserLogin: string
}

export function assertPullRequestReviewCommentEvent(data: IGithubPullRequestReviewCommentEvent): IPullRequestReviewCommentEvent {
  const {
    action,
    repository: { id: repositoryId },
    pull_request: { id: pullRequestId, number, user: { id: pullRequestUserId } },
    comment: { id: commentId, user: { id: commentUserId, login: commentUserLogin } },
  } = data

  const pullRequestReviewCommentEvent: IPullRequestReviewCommentEvent = {
    action,
    repositoryId,
    number,
    pullRequestId,
    pullRequestUserId,
    commentId,
    commentUserId,
    commentUserLogin,
  }

  const [error] = validate(PullRequestReviewCommentEventSchema, pullRequestReviewCommentEvent);
  if (error) {
    const { instancePath, schemaPath } = error;
    throw new SchemaValidationError(
      "PullRequestReviewComment",
      instancePath,
      schemaPath,
      PullRequestReviewCommentEventSchema,
    );
  }

  return pullRequestReviewCommentEvent
}
