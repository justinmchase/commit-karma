import { Schema, validate } from "../../deps/jtd.ts";
import { SchemaValidationError } from "../errors/mod.ts";
import {
  GithubCheckSuiteActions,
  IGithubCheckSuiteEvent,
} from "./github.ts";

const CheckSuiteEventSchema = {
  properties: {
    action: { type: "string" },
    installationId: { type: "number" },
    checkSuiteId: { type: "number" },
    repositoryId: { type: "number" },
    repositoryName: { type: "string" },
    repositoryOwner: { type: "string" },
    commit: { type: "string" },
  },
  optionalProperties: {
    pullRequestId: { type: "number" },
  }
} as Schema;

export interface ICheckSuiteEvent {
  action: GithubCheckSuiteActions
  installationId: number
  pullRequestId?: number
  checkSuiteId: number
  repositoryId: number
  repositoryName: string
  repositoryOwner: string
  commit: string
}

export function assertCheckSuiteEvent(data: IGithubCheckSuiteEvent): ICheckSuiteEvent {
  const {
    action,
    installation: { id: installationId },
    check_suite: {
      id: checkSuiteId,
      head_sha: commit,
      pull_requests: [
        { id: pullRequestId } = { id: undefined }
      ]
    },
    repository: {
      id: repositoryId,
      name: repositoryName,
      owner: {
        login: repositoryOwner,
      }
    },
  } = data

  const checkSuiteEvent = {
    action,
    installationId,
    pullRequestId,
    checkSuiteId,
    repositoryId,
    repositoryName,
    repositoryOwner,
    commit,
  }

  const [error] = validate(CheckSuiteEventSchema, checkSuiteEvent);
  if (error) {
    const { instancePath, schemaPath } = error;
    throw new SchemaValidationError(
      "checkSuite",
      instancePath,
      schemaPath,
      CheckSuiteEventSchema,
    );
  }

  return checkSuiteEvent
}
