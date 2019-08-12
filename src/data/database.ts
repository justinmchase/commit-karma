import assert from 'assert'
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
  head: string,
  prIds: string[],
  installationId: string
}

export enum PullRequestState {
  Open = "open",
  Closed = "closed"
}

export interface IEnsurePullRequest {
  gid: number
  nid: string
  number: number
  head: string
  state: PullRequestState
  title: string
  draft: boolean
  merged: boolean
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
  prId: string
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

  async suitesForOpenPrs(senderId: string) {
    return this.collection.aggregate<{ checkSuiteId: number, owner: string, repo: string }>([
      {
        $match: {
          _type: DataTypes.PullRequest,
          state: PullRequestState.Open,
          senderId
        }
      },
      {
        $lookup: {
          from: 'prod',
          localField: 'head',
          foreignField: 'head',
          as: 'suite'
        }
      },
      { $unwind: '$suite' },
      {
        $match: {
          'suite._type': DataTypes.Suite
        }
      },
      {
        $lookup: {
          from: 'prod',
          localField: 'repoId',
          foreignField: '_id',
          as: 'repo'
        }
      },
      { $unwind: '$repo' },
      {
        $lookup: {
          from: 'prod',
          localField: 'repoId',
          foreignField: '_id',
          as: 'repo'
        }
      },
      { $unwind: '$repo' },
      {
        $lookup: {
          from: 'prod',
          localField: 'repo.ownerId',
          foreignField: '_id',
          as: 'owner'
        }
      },
      { $unwind: '$owner' },
      {
        $project: {
          checkSuiteId: '$suite.gid',
          owner: '$owner.login',
          repo: '$repo.name'
        }
      }
    ])
  }

  async calculateKarma(senderId: string) {
    // Sum of:
    //   - non-draft, open and merged pull requests
    //   - 1 code review per pull request
    //
    //   In other words PR's that are drafts or closed without being merged don't count towards your negative karma
    const results = await this.collection.aggregate<{
      pr: [{ count: number }],
      cr: [{ count: number }]
    }>([
      {
        $facet: {
          pr: [
            {
              $match: {
                _type: "pull_request",
                draft: false,
                senderId,
                $or: [
                  { state: PullRequestState.Open },
                  { state: PullRequestState.Closed, merged: true }
                ]
              }
            },
            { $count: 'count' }
          ],
          cr: [
            {
              $match: {
                _type: "code_review"
              }
            },
            {
              $group: {
                _id: "$prId",
                type: { $first: "$_type" },
                count: { $sum: 1 }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]).toArray()
    const [{
      cr: [{ count: cr = 0 } = {}] = [{}],
      pr: [{ count: pr = 0 } = {}] = [{}]
    } = {}] = results

    return { pr, cr }
  }

  async ensureInstallation(installation: IEnsureInstallation) {
    const { gid, appId, lastAction, senderId } = installation
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
    assert(_id, `Invalid installationId ${installationId}`)
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
    const { gid, nid, branch, head, prIds, installationId } = suite
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
          prIds,
          installationId,
          head,
          updatedAt: new Date()
        },
        $inc: { v: 1 }
      },
      { upsert: true }
    )
    return value ? value._id : _id
  }

  async resolvePullRequestIds(prIds: number[]) {
    const results = await this.collection.find(
      {
        _type: DataTypes.PullRequest,
        gid: { $in: prIds }
      },
      {
        projection: { _id: 1 }
      }
    ).toArray()
    return results.map(r => r._id)
  }
  async ensurePullRequest(pr: IEnsurePullRequest) {
    const { gid, nid, number, head, repoId, state, title, draft, merged, senderId, installationId } = pr
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
          title,
          head,
          draft,
          merged,
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
    const { gid, nid, state, repoId, senderId, prId, installationId } = pr
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
          prId,
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
