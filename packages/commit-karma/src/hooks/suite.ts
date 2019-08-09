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
    const { action, check_suite, repository, sender, installation } = payload
    
    const { id: installationId } = installation // id is gid: number
    const {
      id: suiteId,
      node_id: suiteNid,
      head_branch: branch,
      // head_sha: sha,
      // before, // sha
      // after, // sha
      pull_requests: pullRequests, // id, number, head, base, url
      // app - This is Commit Karma, this app
    } = check_suite

    const {
      id: repoId,
      node_id: repoNid,
      // name: repoName,
      full_name: repoName,
      owner
    } = repository

    const {
      id: ownerId,
      node_id: ownerNid,
      login: ownerLogin
    } = owner

    const {
      id: senderId,
      node_id: senderNid,
      login: senderLogin
    } = sender

    context.log({
      name,
      action,
      senderId,
      senderLogin,
      ownerId,
      ownerLogin,
      repoId,
      repoName,
      installationId
    })

    const iid = await this.db.resolveInstallationId(installationId);
    assert(iid, `Invalid installationId ${installationId}`)

    const sid = await this.db.ensureUser({
      gid: senderId,
      nid: senderNid,
      login: senderLogin
    })
    const oid = await (async () => {
      if (ownerId === senderId) return sid
      return this.db.ensureUser({
        gid: ownerId,
        nid: ownerNid,
        login: ownerLogin
      })
    })()
    const rid = await this.db.ensureRepo({
      gid: repoId,
      nid: repoNid,
      name: repoName,
      ownerId: oid,
      installationId: iid
    })

    const pullRequestIds = []
    for (const { id: prId, number } of pullRequests) {
      context.log({ name, action, prId, number, repoId: rid, senderId: sid })
      const _id = await this.db.ensurePullRequest(prId)
      if (!_id) {
        context.log.error({
          name,
          action,
          pullRequestId: prId,
          pullRequestNumber: number,
          repoId,
          repoName,
          installationId,
          message: "Unknown pull_requst"
        })
        return
      }
      pullRequestIds.push(_id)
    }
    const suid = await this.db.ensureSuite({
      gid: suiteId,
      nid: suiteNid,
      branch,
      pullRequestIds,
      installationId: iid
    })

    if (action === 'requested') {
      // Send a signal back to the PR indicating that we have one check to add
      await context.github.checks.create({
        name: 'Commit Karma',
        head_sha: payload.check_suite.head_sha,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        ...context.repo(),
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
