import { Database } from "../data/database";
import { Application, Context } from "probot";

export class Review {
  constructor(
    private readonly db: Database,
    private readonly app: Application
  ) {
    this.app.on('pull_request_review', this.review.bind(this))
  }

  async review(context: Context) {
    const { name, event, payload } = context
    const {
      action,
      review: {
        id: crid,
        node_id: crnid,
        state: reviewState
      },
      sender: {
        id: sid,
        node_id: snid,
        login: senderLogin
      },
      repository: {
        id: rpid,
        node_id: rpnid,
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
    const ownerId = await this.db.ensureUser({
      gid: oid,
      nid: onid,
      login: ownerLogin
    })
    const senderId = await this.db.ensureUser({
      gid: sid,
      nid: snid,
      login: senderLogin
    })
    const repoId = await this.db.ensureRepo({
      gid: rpid,
      nid: rpnid,
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

    // Ensure this user gets credit for this review
    await this.db.ensureCodeReview({
      gid: crid,
      nid: crnid,
      state: reviewState,
      senderId,
      repoId,
      prId,
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
