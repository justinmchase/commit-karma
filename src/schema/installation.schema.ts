import { Schema, validate } from "../../deps/jtd.ts";
import { SchemaValidationError } from "../errors/mod.ts";
import {
  GithubAccountType,
  GithubInstallationActions,
  IGithubInstallationEvent,
} from "./github.ts";

const InstallationEventSchema = {
  properties: {
    action: { type: "string" },
    id: { type: "number" },
    targetId: { type: "number" },
    type: { type: "string" },
    repositories: {
      elements: {
        type: "number",
      },
    },
  },
} as Schema;

export interface IInstallationEvent {
  action: GithubInstallationActions;
  id: number;
  targetId: number;
  type: GithubAccountType;
  repositories: number[];
}

export function assertInstallationEvent(
  data: IGithubInstallationEvent,
): IInstallationEvent {
  const { action, installation: { id, target_id, target_type }, repositories } =
    data;

  const installationAction = {
    action,
    id,
    targetId: target_id,
    type: target_type,
    repositories: repositories.map(({ id }) => id),
  };

  const [error] = validate(InstallationEventSchema, installationAction);
  if (error) {
    const { instancePath, schemaPath } = error;
    throw new SchemaValidationError(
      "installation",
      instancePath,
      schemaPath,
      InstallationEventSchema,
    );
  }

  return installationAction as IInstallationEvent;
}
