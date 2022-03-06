import { Schema, validate } from "../../deps/jtd.ts";
import { SchemaValidationError } from "../errors/mod.ts";
import { GithubPullRequestActions, IGithubPullRequestEvent } from "./github.ts";

const PullRequestEventSchema = {
  properties: {
    action: { type: "string" },
    installationId: { type: "number" },
    repositoryId: { type: "number" },
    repositoryName: { type: "string" },
    repositoryOwner: { type: "string" },
    pullRequestId: { type: "number" },
    number: { type: "number" },
    userId: { type: "number" },
    userLogin: { type: "string" },
    commit: { type: "string" },
  },
} as Schema;

export interface IPullRequestEvent {
  action: GithubPullRequestActions;
  installationId: number;
  repositoryId: number;
  repositoryName: string;
  repositoryOwner: string;
  pullRequestId: number;
  number: number;
  userId: number;
  userLogin: string;
  commit: string;
}

export function assertPullRequestEvent(
  data: IGithubPullRequestEvent,
): IPullRequestEvent {
  const {
    action,
    number,
    installation: { id: installationId },
    pull_request: {
      id: pullRequestId,
      user: { id: userId, login: userLogin },
      head: {
        sha: commit
      }
    },
    repository: {
      id: repositoryId,
      owner: { login: repositoryOwner },
      name: repositoryName
    },
  } = data;

  const pullRequestEvent: IPullRequestEvent = {
    action,
    installationId,
    repositoryId,
    repositoryName,
    repositoryOwner,
    pullRequestId,
    number,
    userId,
    userLogin,
    commit,
  };

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

  return pullRequestEvent;
}
