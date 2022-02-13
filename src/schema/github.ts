import { Schema, validate } from "../../deps/jtd.ts";
import { Serializable, ISerializable } from "../util/serializable.ts";
import { SchemaValidationError } from "../errors/mod.ts";


export enum GithubEvents {
  Installation = "installation",
  CheckSuite = "check_suite",
  PullRequest = "pull_request",
  CheckRun = "check_run",
}

export enum GithubInstallationActions {
  Deleted = "deleted",
  Created = "created",
}
enum GithubCheckSuiteActions {
  Requested = "requested",
  Completed = "completed",
}
enum GithubPullRequestActions {
  Opened = "opened",
  Synchronize = "synchronize",
  Closed = "closed",
}
enum GithubCheckRunActions {
  Created = "created",
  Completed = "completed",
}

export enum GithubAccountType {
  User = "User",
}

export interface IGithubInstallationEvent extends ISerializable {
  action: GithubInstallationActions
  installation: IGithubInstallation
  repositories: IGithubRepository[]
  sender: IGithubAccount
}

export interface IGithubAccount extends ISerializable {
  id: number // 10974
  login: string // "justinmchase",
  node_id: string
  avatar_url: string
  gravatar_id: string | ""
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: GithubAccountType,
  site_admin: boolean
}

export interface IGithubInstallation extends ISerializable {
  id: number // 1367162,
  app_id: number // 37724,
  target_id: number
  account: IGithubAccount
  repository_selection: "selected" | string
  access_tokens_url: string // "https://api.github.com/app/installations/1367162/access_tokens",
  repositories_url: string
  html_url: string
  app_slug: "commit-karma"
  target_type: GithubAccountType
  permissions: {
    checks: "write"
    issues: "read"
    metadata: "read"
    pull_requests: "read"
  },
  events: [
    "check_run",
    "check_suite",
    "pull_request",
    "pull_request_review",
    "pull_request_review_comment"
  ],
  created_at: string // "2019-08-06T01:48:23.000Z",
  updated_at: string // "2020-08-04T01:57:42.000Z",
  single_file_name: string | null,
  has_multiple_single_files: boolean,
  single_file_paths: string[]
  suspended_by: string | null
  suspended_at: string | null
}

export interface IGithubRepository extends ISerializable {
  id: number // 42285322,
  node_id: string // "MDEwOlJlcG9zaXRvcnk0MjI4NTMyMg==",
  name: string // "bewmdone",
  full_name: string // "justinmchase/bewmdone",
  private: boolean
}

const InstallationEventSchema = {
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

export interface IInstallationEvent {
  action: GithubInstallationActions
  id: number
  targetId: number
  type: GithubAccountType
  repositories: number[]
}

export function assertInstallationEvent(data: IGithubInstallationEvent): IInstallationEvent {
  const { action, installation: { id, target_id, target_type }, repositories } = data

  const installationAction = {
    action,
    id,
    targetId: target_id,
    type: target_type,
    repositories: repositories.map(({ id }) => id)
  }

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

  return installationAction as IInstallationEvent
}
