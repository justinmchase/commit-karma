import { Schema, validate } from "../../deps/jtd.ts";
import { SchemaValidationError } from "../errors/mod.ts";
import {
  GithubPullRequestReviewActions,
  IGithubPullRequestReviewEvent,
} from "./github.ts";

const PullRequestReviewEventSchema = {
  properties: {
    action: { type: "string" },
    repositoryId: { type: "number" },
    number: { type: "number" },
    pullRequestId: { type: "number" },
    pullRequestUserId: { type: "number" },
    reviewId: { type: "number" },
    reviewUserId: { type: "number" },
  }
} as Schema;

export interface IPullRequestReviewEvent {
  action: GithubPullRequestReviewActions
  repositoryId: number
  number: number
  pullRequestId: number
  pullRequestUserId: number
  reviewId: number
  reviewUserId: number
}

export function assertPullRequestReviewEvent(data: IGithubPullRequestReviewEvent): IPullRequestReviewEvent {
  const {
    action,
    repository: { id: repositoryId },
    pull_request: { id: pullRequestId, number, user: { id: pullRequestUserId } },
    review: { id: reviewId, user: { id: reviewUserId } },
  } = data

  const pullRequestReviewEvent: IPullRequestReviewEvent = {
    action,
    repositoryId,
    number,
    pullRequestId,
    pullRequestUserId,
    reviewId,
    reviewUserId,
  }

  const [error] = validate(PullRequestReviewEventSchema, pullRequestReviewEvent);
  if (error) {
    const { instancePath, schemaPath } = error;
    throw new SchemaValidationError(
      "PullRequestReview",
      instancePath,
      schemaPath,
      PullRequestReviewEventSchema,
    );
  }

  return pullRequestReviewEvent
}
