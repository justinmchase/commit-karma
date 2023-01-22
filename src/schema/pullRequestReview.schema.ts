import {
  GithubPullRequestReviewActions,
} from "./github.ts";

export interface IPullRequestReviewEvent {
  action: GithubPullRequestReviewActions;
  repositoryId: number;
  number: number;
  pullRequestId: number;
  pullRequestUserId: number;
  reviewId: number;
  reviewUserId: number;
  reviewUserLogin: string;
}
