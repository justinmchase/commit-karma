import { GithubCheckSuiteActions } from "./github.ts";

export interface ICheckSuiteEvent {
  action: GithubCheckSuiteActions;
  installationId: number;
  pullRequestId?: number;
  checkSuiteId: number;
  repositoryId: number;
  repositoryName: string;
  repositoryOwner: string;
  commit: string;
}
