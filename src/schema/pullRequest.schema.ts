import { GithubPullRequestActions } from "./github.ts";

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
