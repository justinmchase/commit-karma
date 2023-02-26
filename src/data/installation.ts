import { GithubAccountType } from "../schema/github.ts";
import { ModelState } from "./state.ts";

export type Installation = {
  _id: string;
  _ts: number;
  state: ModelState;
  installationId: number;
  targetId: number;
  targetType: GithubAccountType;
  repositoryId: number;
};
