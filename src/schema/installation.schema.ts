import { GithubAccountType, GithubInstallationActions } from "./github.ts";

export interface IInstallationEvent {
  action: GithubInstallationActions;
  id: number;
  targetId: number;
  type: GithubAccountType;
  repositories: number[];
}
