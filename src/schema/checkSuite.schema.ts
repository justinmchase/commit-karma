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
    userId: { type: "number" },
    userLogin: { type: "string" },
    checkSuiteId: { type: "number" },
    repositoryId: { type: "number" },
    repositoryName: { type: "string" },
    repositoryOwner: { type: "string" },
    commit: { type: "string" },
  }
} as Schema;

export interface ICheckSuiteEvent {
  action: GithubCheckSuiteActions
  installationId: number
  userId: number
  userLogin: string
  checkSuiteId: number
  repositoryId: number
  repositoryName: string
  repositoryOwner: string
  commit: string
}

export function assertCheckSuiteEvent(data: IGithubCheckSuiteEvent): ICheckSuiteEvent {
  console.log(JSON.stringify(data, null, 2))
  const {
    action,
    installation: { id: installationId },
    check_suite: {
      id: checkSuiteId,
      head_sha: commit,
      pull_requests: [
        { user: { id: userId, login: userLogin } }
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
    userId,
    userLogin,
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
