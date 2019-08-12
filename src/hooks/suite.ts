import assert from 'assert'
import { Application, Context } from "probot";
import { Database } from "../data/database";

export class Suite {
  constructor(
    private readonly db: Database,
    private readonly app: Application
  ) {
    this.app.on('check_suite', this.check.bind(this))
  }

  public async check(context: Context) {
    const { name,  payload } = context
    const {
      action,
      repository: {
        id: rid,
        node_id: rnid,
        name: repoName,
        owner: {
          id: oid,
          node_id: onid,
          login: ownerLogin,
        }
      },
      check_suite: {
        id: sid,
        node_id: snid,
        head_sha: head,
        head_branch: branch,
        pull_requests: pullRequests,
      },
      installation: {
        id: iid
      }
    } = payload

    const installationId = await this.db.resolveInstallationId(iid);
    const ownerId = await this.db.ensureUser({
      gid: oid,
      nid: onid,
      login: ownerLogin
    })
    const repoId = await this.db.ensureRepo({
      gid: rid,
      nid: rnid,
      name: repoName,
      ownerId,
      installationId,
    })
    
    const prIds = await this.db.resolvePullRequestIds(pullRequests.map(pr => pr.id))
    const suiteId = await this.db.ensureSuite({
      gid: sid,
      nid: snid,
      branch,
      head,
      prIds,
      installationId
    })

    context.log({
      name,
      action,
      ownerId,
      ownerLogin,
      repoId,
      repoName,
      suiteId,
      installationId
    })

    if (action === 'requested' || action === 'rerequested') {
      // Send a signal back to the PR indicating that we have one check to add
      await context.github.checks.create({
        name: 'Commit Karma',
        head_sha: payload.check_suite.head_sha,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        ...context.repo(),
      })
    } else if (action === 'completed') {
      context.log.info({
        name,
        action
      })
    } else {
      context.log.error({
        name,
        action,
        message: 'Unknown action for Suite'
      })
    }
  }
}
