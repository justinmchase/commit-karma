import { GithubAccountType } from "../schema/github.ts";
import { State } from "./state.ts";

export type Installation = {
  _id: string;
  _ts: number;
  state: State;
  installationId: number;
  targetId: number;
  targetType: GithubAccountType;
  repositoryId: number;
};
