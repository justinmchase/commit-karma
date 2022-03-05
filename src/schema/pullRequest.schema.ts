import { Schema, validate } from "../../deps/jtd.ts";
import { SchemaValidationError } from "../errors/mod.ts";
import {
  GithubPullRequestActions,
  IGithubPullRequestEvent,
} from "./github.ts";

const PullRequestEventSchema = {
  properties: {
    action: { type: "string" },
    repositoryId: { type: "number" },
    pullRequestId: { type: "number" },
    number: { type: "number" },
    userId: { type: "number" },
  }
} as Schema;

export interface IPullRequestEvent {
  action: GithubPullRequestActions
  repositoryId: number
  pullRequestId: number
  number: number
  userId: number
}

export function assertPullRequestEvent(data: IGithubPullRequestEvent): IPullRequestEvent {
  const {
    action,
    number,
    pull_request: { id: pullRequestId, user: { id: userId } },
    repository: { id: repositoryId },
  } = data

  const pullRequestEvent: IPullRequestEvent = {
    action,
    repositoryId,
    pullRequestId,
    number,
    userId
  }

  const [error] = validate(PullRequestEventSchema, pullRequestEvent);
  if (error) {
    const { instancePath, schemaPath } = error;
    throw new SchemaValidationError(
      "PullRequest",
      instancePath,
      schemaPath,
      PullRequestEventSchema,
    );
  }

  return pullRequestEvent
}
