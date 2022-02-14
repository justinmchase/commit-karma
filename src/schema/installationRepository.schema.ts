import { Schema, validate } from "../../deps/jtd.ts";
import { SchemaValidationError } from "../errors/mod.ts";
import {
  GithubAccountType,
  GithubInstallationRepositoryActions,
  IGithubInstallationRepositoryEvent
} from "./github.ts";

const InstallationRepositoryEventSchema = {
  properties: {
    action: { type: "string" },
    id: { type: "number" },
    targetId: { type: "number" },
    type: { type: "string" },
    repositories: {
      elements: {
        type: "number"
      }
    }
  }
} as Schema;

export interface IInstallationRepositoryEvent {
  action: GithubInstallationRepositoryActions
  id: number
  targetId: number
  type: GithubAccountType
  repositories: number[]
}

export function assertInstallationRepositoryEvent(data: IGithubInstallationRepositoryEvent): IInstallationRepositoryEvent {
  const { action, installation: { id, target_id, target_type }, repositories_added, repositories_removed } = data

  const installationAction = {
    action,
    id,
    targetId: target_id,
    type: target_type,
    repositories: repositories_added.concat(repositories_removed).map(({ id }) => id)
  }

  const [error] = validate(InstallationRepositoryEventSchema, installationAction);
  if (error) {
    const { instancePath, schemaPath } = error;
    throw new SchemaValidationError(
      "installation",
      instancePath,
      schemaPath,
      InstallationRepositoryEventSchema,
    );
  }

  return installationAction as IInstallationRepositoryEvent
}
