import { State } from "./state.ts";

export enum InteractionKind {
  PullRequest = "pull_request", // -5
  Issue = "issue", // -5
  Comment = "comment", // +1
  Review = "review", // +2.5
  Merged = "merged", // +10
}

export const InteractionScore = {
  [InteractionKind.PullRequest]: -5,
  [InteractionKind.Issue]: -5,
  [InteractionKind.Comment]: +1,
  [InteractionKind.Review]: 2.5,
  [InteractionKind.Merged]: 10,
};

export type Interaction = {
  _id: string;
  _ts: number;
  state: State;
  kind: InteractionKind;
  repositoryId: number;
  id: number; // issue, pull_request, comment, etc.
  number: number;
  userId: number;
  userLogin: string;
  score: number;
};
