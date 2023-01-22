import {
  GithubAccountType,
  GithubInstallationRepositoryActions,
} from "./github.ts";

export interface IInstallationRepositoryEvent {
  action: GithubInstallationRepositoryActions;
  id: number;
  targetId: number;
  type: GithubAccountType;
  repositories: number[];
}
