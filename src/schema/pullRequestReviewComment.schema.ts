import {
  GithubPullRequestReviewCommentActions,
} from "./github.ts";

export interface IPullRequestReviewCommentEvent {
  action: GithubPullRequestReviewCommentActions;
  repositoryId: number;
  number: number;
  pullRequestId: number;
  pullRequestUserId: number;
  commentId: number;
  commentUserId: number;
  commentUserLogin: string;
}
