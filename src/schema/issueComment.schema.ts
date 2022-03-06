import { Schema, validate } from "../../deps/jtd.ts";
import { SchemaValidationError } from "../errors/mod.ts";
import {
  GithubIssueCommentActions,
  IGithubIssueCommentEvent,
} from "./github.ts";

const IssueCommentEventSchema = {
  properties: {
    action: { type: "string" },
    installationId: { type: "number" },
    repositoryId: { type: "number" },
    number: { type: "number" },
    issueId: { type: "number" },
    issueUserId: { type: "number" },
    issueUserLogin: { type: "string" },
    commentId: { type: "number" },
    commentUserId: { type: "number" },
  }
} as Schema;

export interface IIssueCommentEvent {
  action: GithubIssueCommentActions
  repositoryId: number
  number: number
  issueId: number
  issueUserId: number
  issueUserLogin: string
  commentId: number
  commentUserId: number
}

export function assertIssueCommentEvent(data: IGithubIssueCommentEvent): IIssueCommentEvent {
  const {
    action,
    issue: { id: issueId, number, user: { id: issueUserId, login: issueUserLogin } },
    comment: { id: commentId, user: { id: commentUserId } },
    repository: { id: repositoryId },
    installation: { id: installationId }
  } = data

  const issueCommentEvent = {
    action,
    installationId,
    repositoryId,
    number,
    issueId,
    issueUserId,
    issueUserLogin,
    commentId,
    commentUserId,
  }

  const [error] = validate(IssueCommentEventSchema, issueCommentEvent);
  if (error) {
    const { instancePath, schemaPath } = error;
    throw new SchemaValidationError(
      "issueComment",
      instancePath,
      schemaPath,
      IssueCommentEventSchema,
    );
  }

  return issueCommentEvent
}
