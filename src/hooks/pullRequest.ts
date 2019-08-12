import { Database } from "../data/database";
import { Application, Context } from "probot";

export class PullRequest {
  constructor(
    private readonly db: Database,
    private readonly app: Application
  ) {
    this.app.on('pull_request', this.pr.bind(this))
  }
  
  async pr(context: Context) {
    const { name, event, payload } = context
    const {
      action,
      sender: {
        id: sid,
        node_id: snid,
        login: senderLogin
      },
      repository: {
        id: rid,
        node_id: rnid,
        name: repoName,
        owner: {
          id: oid,
          node_id: onid,
          login: ownerLogin
        }
      },
      pull_request: {
        id: prid,
        node_id: prnid,
        number: prNumber,
        state: prState,
        title: prTitle,
        draft: prDraft,
        merged: prMerged,
        head: {
          sha: prHead
        }
      },
      installation: {
        id: iid
      }
    } = payload
    const installationId = await this.db.resolveInstallationId(iid);
    const senderId = await this.db.ensureUser({
      gid: sid,
      nid: snid,
      login: senderLogin
    })
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
      installationId
    })
    const prId = await this.db.ensurePullRequest({
      gid: prid,
      nid: prnid,
      number: prNumber,
      head: prHead,
      state: prState,
      title: prTitle,
      draft: prDraft,
      merged: prMerged,
      repoId,
      senderId,
      installationId
    })

    // todo: process this in a queue...
    const cursor = await this.db.suitesForOpenPrs(senderId)
    while (await cursor.hasNext()) {
      const { checkSuiteId, owner, repo } = await cursor.next()
      context.github.checks.rerequestSuite({
        check_suite_id: checkSuiteId,
        owner,
        repo
      })
    }
    
    context.log({
      name,
      action,
      event,
      senderId,
      senderLogin,
      ownerId,
      ownerLogin,
      repoId,
      repoName,
      prId,
      prTitle,
      installationId
    })
  }
}
