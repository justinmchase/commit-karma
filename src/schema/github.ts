import { ISerializable } from "../util/serializable.ts";

export enum GithubEvents {
  Installation = "installation",
  InstallationRepositories = "installation_repositories",
  InstallationNewPermissionsAccepted = "new_permissions_accepted",
  CheckSuite = "check_suite",
  CheckRun = "check_run",
  PullRequest = "pull_request",
  PullRequestReview = "pull_request_review",
  PullRequestReviewComment = "pull_request_review_comment",
  IssueComment = "issue_comment",
}

export enum GithubInstallationActions {
  Deleted = "deleted",
  Created = "created",
}

export enum GithubInstallationRepositoryActions {
  Added = "added",
  Removed = "removed",
}

export enum GithubIssueCommentActions {
  Created = "created",
  Edited = "edited",
  Deleted = "deleted",
}

export enum GithubCheckSuiteActions {
  Requested = "requested",
  Completed = "completed",
  Rerequested = "rerequested",
}

export enum GithubCheckSuiteStatus {
  Queued = "queued",
  InProgress = "in_progress",
  Completed = "completed",
}

export enum GithubCheckSuiteConclusion {
  ActionRequired = "action_required",
  Neutral = "neutral",
  Cancelled = "cancelled",
  Failure = "failure",
  Success = "success",
  Skipped = "skipped",
  Stale = "stale",
  TimedOut = "timed_out",
}

export enum GithubCheckRunActions {
  Created = "created",
  Completed = "completed",
  Rerequested = "rerequested",

  // todo: support actions?
  // https://docs.github.com/en/rest/guides/getting-started-with-the-checks-api#check-runs-and-requested-actions
  // basically you add actions which manifest as buttons, when the user clicks them
  // it calls the webhook with this event.
  RequestedAction = "requested_action",
}

export enum GithubPullRequestActions {
  Opened = "opened",
  Edited = "edited",
  Synchronize = "synchronize",
  Labeled = "labeled",
  Assigned = "assigned",
  Closed = "closed",
  AutoMergeDisabled = "auto_merge_disabled",
  AutoMergeEnabled = "auto_merge_enabled",
  ConvertToDraft = "converted_to_draft",
  Locked = "locked",
  ReadyForReview = "ready_for_review",
  Reopened = "reopened",
  ReviewRequestRemoved = "review_request_removed",
  ReviewRequested = "review_requested",
  Unassigned = "unassigned",
  Unlabeled = "unlabeled",
  Unlocked = "unlocked",
}

export enum GithubPullRequestReviewActions {
  Submitted = "submitted",
  Edited = "edited",
  Dismissed = "dismissed",
}

export enum GithubPullRequestReviewCommentActions {
  Created = "created",
  Edited = "edited",
  Deleted = "deleted",
}

export enum GithubAccountType {
  User = "User",
}

export enum GithubCheckRunStatus {
  Queued = "queued",
  InProgress = "in_progress",
  Completed = "completed",
}

export enum GithubCheckRunConclusion {
  ActionRequired = "action_required",
  Cancelled = "cancelled",
  Failure = "failure",
  Neutral = "neutral",
  Success = "success",
  Skipped = "skipped",
  Stale = "stale",
  TimedOut = "timed_out",
}

export enum GithubPermissions {
  Read = "read",
  Write = "write",
}


export interface IGithubInstallationEvent extends ISerializable {
  action: GithubInstallationActions
  installation: IGithubInstallation
  repositories: IGithubRepository[]
  sender: IGithubAccount
}

export interface IGithubInstallationRepositoryEvent extends ISerializable {
  action: GithubInstallationRepositoryActions
  installation: IGithubInstallation
  repository_selection: "selected"
  repositories_added: IGithubRepository[]
  repositories_removed: IGithubRepository[]
  requester: IGithubAccount | null
  sender: IGithubAccount
}

export interface IGithubIssueCommentEvent extends ISerializable {
  action: GithubIssueCommentActions
  issue: IGithubIssue
  comment: IGithubComment
  repository: IGithubRepository // actually a full repository here
  sender: IGithubAccount
  installation: {
    id: number
    node_id: string
  }
}

export interface IGithubPullRequestEvent extends ISerializable {
  action: GithubPullRequestActions
  number: number
  pull_request: IGithubPullRequest
  changes: Record<string, string>
  repository: IGithubRepository
  sender: IGithubAccount
  installation: {
    id: number
    node_id: string
  }
}

export interface IGithubPullRequestReviewEvent extends ISerializable {
  action: GithubPullRequestReviewActions
  pull_request: IGithubPullRequest
  review: IGithubReview
  changes: Record<string, ISerializable>
  repository: IGithubRepository
  organization: null // todo
  sender: IGithubAccount
  installation: {
    id: number
    node_id: string
  }
}

export interface IGithubPullRequestReviewCommentEvent extends ISerializable {
  action: GithubPullRequestReviewCommentActions
  comment: IGithubComment
  pull_request: IGithubPullRequest
  repository: IGithubRepository
  sender: IGithubAccount
}

export interface IGithubCheckSuiteEvent extends ISerializable {
  action: GithubCheckSuiteActions
  check_suite: IGithubCheckSuite
  repository: IGithubRepository
  installation: IGithubInstallation
  sender: IGithubAccount
}

export interface IGithubCheckSuite extends ISerializable {
  id: number
  node_id: string
  head_branch: string
  head_sha: string
  status: GithubCheckSuiteStatus // "completed",
  conclusion: GithubCheckSuiteConclusion // "neutral",
  url: string
  before: string
  after: string
  pull_requests: IGithubPullRequest[]
  app: IGithubApp
  created_at: string
  updated_at: string
  head_commit: IGithubCommit
  latest_check_runs_count: number
  check_runs_url: string
}

export interface IGithubReview extends ISerializable {
  id: number
  node_id: string
  user: IGithubAccount
  body: null,
  commit_id: string
  submitted_at: string // iso date
  state: "commented"
  html_url: string
  pull_request_url: string
  author_association: "OWNER"
  _links: {
    html: {
      href: string
    },
    pull_request: {
      href: string
    }
  }
}

export interface IGithubAccount extends ISerializable {
  id: number // 10974
  login: string // "justinmchase",
  node_id: string
  avatar_url: string
  gravatar_id: string | ""
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: GithubAccountType,
  site_admin: boolean
}

export interface IGithubInstallation extends ISerializable {
  id: number // 1367162,
  app_id: number // 37724,
  target_id: number
  account: IGithubAccount
  repository_selection: "selected" | string
  access_tokens_url: string // "https://api.github.com/app/installations/1367162/access_tokens",
  repositories_url: string
  html_url: string
  app_slug: "commit-karma"
  target_type: GithubAccountType
  permissions: {
    checks: "write"
    issues: "read"
    metadata: "read"
    pull_requests: "read"
  },
  events: [
    "check_run",
    "check_suite",
    "pull_request",
    "pull_request_review",
    "pull_request_review_comment"
  ],
  created_at: string // "2019-08-06T01:48:23.000Z",
  updated_at: string // "2020-08-04T01:57:42.000Z",
  single_file_name: string | null,
  has_multiple_single_files: boolean,
  single_file_paths: string[]
  suspended_by: string | null
  suspended_at: string | null
}

export interface IGithubRepository extends ISerializable {
  id: number // 42285322,
  node_id: string // "MDEwOlJlcG9zaXRvcnk0MjI4NTMyMg==",
  name: string // "bewmdone",
  full_name: string // "justinmchase/bewmdone",
  private: boolean
  owner: IGithubAccount
}

export interface IGithubIssue extends ISerializable {
  id: number
  node_id: string
  number: number
  title: string
  user: IGithubAccount
  labels: string[]
  state: "open"
  locked: boolean
  // assignee: unknown | null
  // asignees: unknown[]
  // milestone: unknown
  comments: number
  created_at: string
  updated_at: string
  closed_at: string | null
  author_association: "OWNER"
  active_lock_reason: string | null
  draft: boolean
  pull_request: {
    "url": string
    "html_url": string
    "diff_url": string
    "patch_url": string
    "merged_at": string | null
  },
  body: string | null
  reqctions: {
    "url": string
    "total_count": number
    "+1": number
    "-1": number
    "laugh": number
    "hooray": number
    "confused": number
    "heart": number
    "rocket": number
    "eyes": number
  }
  timeline_url: string
  performed_via_github_app: null
}

export interface IGithubComment extends ISerializable {
  url: string
  html_url: string
  issue_url: string
  id: number
  node_id: string
  user: IGithubAccount
  created_at: string
  updated_at: string
  author_association: "OWNER"
  body: string
  reactions: {
    url: string
    total_count: number
    "+1": number
    "-1": number
    laugh: number
    hooray: number
    confused: number
    heart: number
    rocket: number
    eyes: 0
  },
  performed_via_github_app: null
}

export interface IGithubCommit extends ISerializable {
  "label": string
  "ref": string
  "sha": string
  "user": IGithubAccount
  "repo": IGithubRepository // full repo
}

export interface IGithubPullRequest extends ISerializable {
  url: string
  id: number
  node_id: string
  html_url: string
  diff_url: string
  patch_url: string
  issue_url: string
  number: number
  state: "open"
  locked: boolean
  title: string
  user: IGithubAccount
  body: string
  created_at: string // iso date
  updated_at: string
  closed_at: string | null
  merged_at: string | null
  merge_commit_sha: string
  assignee: null
  assignees: []
  requested_reviewers: []
  requested_teams: []
  labels: []
  milestone: null,
  draft: boolean
  commits_url: string
  review_comments_url: string
  review_comment_url: string
  comments_url: string
  statuses_url: string
  head: IGithubCommit
  base: IGithubCommit
  _links: {
    self: {
      href: string
    },
    html: {
      href: string
    },
    issue: {
      href: string
    },
    comments: {
      href: string
    },
    review_comments: {
      href: string
    },
    review_comment: {
      href: string
    },
    commits: {
      href: string
    },
    statuses: {
      href: string
    }
  },
  author_association: "OWNER"
  auto_merge: null
  active_lock_reason: null
  merged: boolean
  mergeable: boolean
  rebaseable: boolean
  mergeable_state: "unstable"
  merged_by: null
  comments: number
  review_comments: number
  maintainer_can_modify: boolean
  commits: number
  additions: number
  deletions: number
  changed_files: number
}

export interface IGithubApp extends ISerializable {
  id: number
  node_id: string
  slug: string
  name: string
  description: string
  owner: IGithubAccount
  external_url: string
  html_url: string
  created_at: string
  updated_at: string
  permissions: {
    metadata: GithubPermissions
    contents: GithubPermissions
    issues: GithubPermissions
    single_file: GithubPermissions
  },
  events: GithubEvents[]
}


export interface IGithubCreateCheckRun extends ISerializable {
  name: string
  head_sha: string
  details_url?: string
  external_id?: string
  status?: GithubCheckRunStatus
  started_at: string // YYYY-MM-DDTHH:MM:SSZ
  completed_at?: string
  conclusion?: GithubCheckRunConclusion
  output?: IGithubCheckRunOutput
  actions?: IGithubCheckRunActions[]
}

export interface IGithubCheckRunOutput extends ISerializable {
  title: string // Required. The title of the check run.
  summary: string // Required. The summary of the check run. This parameter supports Markdown.
  text?: string // The details of the check run. This parameter supports Markdown.
  annotations: IGithubCheckRunAnnotation[]
  images: IGithubCheckRunImage[]
}

export interface IGithubCheckRunAnnotation extends ISerializable {
  path: string              // Required. The path of the file to add an annotation to. For example, assets/css/main.css.
  start_line: number        // Required. The start line of the annotation.
  end_line: number          // Required. The end line of the annotation.
  start_column: number      // The start column of the annotation. Annotations only support start_column and end_column on the same line. Omit this parameter if start_line and end_line have different values.
  end_column: number        // The end column of the annotation. Annotations only support start_column and end_column on the same line. Omit this parameter if start_line and end_line have different values.
  annotation_level: string  // Required. The level of the annotation. Can be one of notice, warning, or failure.
  message: string           // Required. A short description of the feedback for these lines of code. The maximum size is 64 KB.
  title: string             // The title that represents the annotation. The maximum size is 255 characters.
  raw_details: string       // Details about this annotation. The maximum size is 64 KB.
}

export interface IGithubCheckRunImage extends ISerializable {
  alt: string	      // Required. The alternative text for the image.
  image_url: string	// Required. The full URL of the image.
  caption: string	  // A short image description.
}

export interface IGithubCheckRunActions extends ISerializable {
  label: string       // Required. The text to be displayed on a button in the web UI. The maximum size is 20 characters.
  description: string // Required. A short explanation of what this action would do. The maximum size is 40 characters.
  identifier: string  // Required. A reference for the action on the integrator's system. The maximum size is 20 characters.
}
