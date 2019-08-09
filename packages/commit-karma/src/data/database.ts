import id from 'nanoid'
import { MongoClient, Db, Collection } from 'mongodb'

const mongoUrl = process.env.MONGO_URL
const dbName = process.env.MONGO_DB

export interface IEnsureUser {
  gid: number
  nid: string
  login: string
}

export enum InstallationActions {
  NewPermissionsAccepted = "new_permissions_accepted"
}

export interface IEnsureInstallation {
  gid: number
  appId: number
  lastAction: string
  senderId: string
  accountId: string
}

export interface IEnsureRepo {
  gid: number,
  nid: string,
  name: string,
  ownerId: string
  installationId: string
}

export interface IEnsureSuite {
  gid: number
  nid: string
  branch: string,
  pullRequestIds: string[],
  installationId: string
}

export enum PullRequestState {
  Open = "open"
}

export interface IEnsurePullRequest {
  gid: number
  nid: string
  number: number
  state: PullRequestState
  repoId: string
  senderId: string
  installationId: string
}

export enum DataTypes {
  User = "user",
  Installation = "installation",
  Repo = "repo",
  Suite = "suite",
  PullRequest = "pull_request",
  CodeReview = "code_review",
  Run = "run"
}

export enum RunConclusion {
  Pass = "success",
  Fail = "failure",
  Neutral = "neutral",
  Cancelled = "cancelled",
  TimedOut = "timed_out",
  ActionRequired = "action_required"
}

export enum RunStatus {
  Completed = "completed"
}

export interface IEnsureRun {
  gid: number
  nid: string
  senderId: string
  suiteId: string
  repoId: string
  installationId: string
  status: RunStatus
  conclusion: RunConclusion
  karma: number
}

export enum CodeReviewState {
  Commented = "commented"
}

export interface IEnsureCodeReview {
  gid: number
  nid: string
  state: CodeReviewState
  senderId: string
  repoId: string
  pullRequestId: string
  installationId: string

}

export class Database {

  private client: MongoClient
  private db: Db
  private collection: Collection<any>

  async init() {
    this.client = await MongoClient.connect(mongoUrl, {
      useNewUrlParser: true
    })
    this.db = this.client.db(dbName)
    this.collection = this.db.collection('prod')
  }

  async calculateKarma(senderId: string) {
    const results = await this.collection.aggregate([
      {
        $match: {
          $or: [
            { _type: "pull_request", senderId },
            { _type: "code_review", senderId }
          ]
        }
      },
      {
        $group: {
          _id: "$_type",
          count: { $sum: 1 }
        }
      }
    ]).toArray()

    const pr = results.find(r => r._id === DataTypes.PullRequest)
    const cr = results.find(r => r._id === DataTypes.CodeReview)

    return {
      pr: pr ? pr.count : 0,
      cr: cr ? cr.count : 0
    }
  }

  async ensureInstallation(installation: IEnsureInstallation) {
    const { gid, appId, lastAction, senderId, accountId } = installation
    const _id = id()
    const { value } = await this.collection.findOneAndUpdate(
      { _type: DataTypes.Installation, gid, appId },
      {
        $setOnInsert: {
          _id,
          _type: DataTypes.Installation,
          gid,
          appId,
          createdAt: new Date()
        },
        $set: {
          lastAction,
          senderId,
          accountId,
          updatedAt: new Date()
        },
        $inc: { v: 1 }
      },
      { upsert: true }
    )

    return value ? value._id : _id
  }

  async resolveInstallationId(installationId: number) {
    const { _id } = await this.collection.findOne(
      {
        _type: DataTypes.Installation,
        gid: installationId
      },
      {
        projection: { _id: 1 }
      }
    )
    return _id
  }

  async ensureUser(user: IEnsureUser): Promise<string> {
    const { nid, gid, login } = user;
    const _id = id()
    const { value } = await this.collection.findOneAndUpdate(
      { _type: DataTypes.User, nid, gid },
      {
        $setOnInsert: {
          _id,
          _type: DataTypes.User,
          nid,
          gid,
          createdAt: new Date()
        },
        $set: {
          login,
          updatedAt: new Date()
        },
        $inc: { v: 1 }
      },
      { upsert: true }
    )
    return value ? value._id : _id
  }

  async ensureRepo(repo: IEnsureRepo): Promise<string> {
    const { gid, nid, name, ownerId, installationId } = repo
    const _id = id()
    const { value } = await this.collection.findOneAndUpdate(
      { _type: DataTypes.Repo, gid, nid },
      {
        $setOnInsert: {
          _id,
          _type: DataTypes.Repo,
          gid,
          nid,
          createdAt: new Date()
        },
        $set: {
          name,
          ownerId,
          installationId,
          updatedAt: new Date()
        },
        $inc: { v: 1 }
      },
      { upsert: true }
    )
    return value ? value._id : _id
  }

  async ensureSuite(suite: IEnsureSuite): Promise<string> {
    const { gid, nid, branch, pullRequestIds, installationId } = suite
    const _id = id()
    const { value } = await this.collection.findOneAndUpdate(
      { _type: DataTypes.Suite, gid, nid },
      {
        $setOnInsert: {
          _id,
          _type: DataTypes.Suite,
          gid,
          nid,
          createdAt: new Date()
        },
        $set: {
          branch,
          pullRequestIds,
          installationId,
          updatedAt: new Date()
        },
        $inc: { v: 1 }
      },
      { upsert: true }
    )
    return value ? value._id : _id
  }

  async resolvePullRequestId(pullRequestId: number) {
    const { _id } = await this.collection.findOne(
      {
        _type: DataTypes.PullRequest,
        gid: pullRequestId
      },
      {
        projection: { _id: 1 }
      }
    )
    return _id
  }
  async ensurePullRequest(pr: IEnsurePullRequest) {
    const { gid, nid, number, repoId, state, senderId, installationId } = pr
    const _id = id()
    const { value } = await this.collection.findOneAndUpdate(
      { _type: DataTypes.PullRequest, gid, nid },
      {
        $setOnInsert: {
          _id,
          _type: DataTypes.PullRequest,
          gid,
          nid,
          number,
          createdAt: new Date()
        },
        $set: {
          state,
          repoId,
          senderId,
          installationId,
          updatedAt: new Date()
        },
        $inc: { v: 1 }
      },
      { upsert: true }
    )
    return value ? value._id : _id
  }

  async ensureRun(run: IEnsureRun) {
    const { gid, nid, status, conclusion, karma, senderId, suiteId, installationId, repoId } = run
    const _id = id()
    const { value } = await this.collection.findOneAndUpdate(
      { _type: DataTypes.Run, gid, nid },
      {
        $setOnInsert: {
          _id,
          _type: DataTypes.Run,
          gid,
          nid,
          createdAt: new Date()
        },
        $set: {
          status,
          conclusion,
          karma,
          senderId,
          suiteId,
          repoId,
          installationId,
          updatedAt: new Date()
        },
        $inc: { v: 1 }
      },
      { upsert: true }
    )
    return value ? value._id : _id

  }
  
  async ensureCodeReview(pr: IEnsureCodeReview) {
    const { gid, nid, state, repoId, senderId, pullRequestId, installationId } = pr
    const _id = id()
    const { value } = await this.collection.findOneAndUpdate(
      { _type: DataTypes.CodeReview, gid, nid },
      {
        $setOnInsert: {
          _id,
          _type: DataTypes.CodeReview,
          gid,
          nid,
          createdAt: new Date()
        },
        $set: {
          state,
          repoId,
          senderId,
          pullRequestId,
          installationId,
          updatedAt: new Date()
        },
        $inc: { v: 1 }
      },
      { upsert: true }
    )
    return value ? value._id : _id
  }
}
