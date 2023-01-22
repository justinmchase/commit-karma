import {
  GithubIssueCommentActions,
} from "./github.ts";

export interface IIssueCommentEvent {
  action: GithubIssueCommentActions;
  repositoryId: number;
  number: number;
  issueId: number;
  issueUserId: number;
  issueUserLogin: string;
  commentId: number;
  commentUserId: number;
}
