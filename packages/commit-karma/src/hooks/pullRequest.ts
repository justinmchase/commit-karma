import { Database } from "../data/database";
import { Application, Context } from "probot";

export class PullRequest {
  constructor(
    private readonly db: Database,
    private readonly app: Application
  ) {
    this.app.on('pull_request', this.pr.bind(this))
    this.app.on('pull_request_review', this.review.bind(this))
    // - pull_request_review_comment
  }
  
  async pr(context: Context) {
    const { name, event, payload } = context
    const { action, pull_request, repository, sender, installation } = payload
    const { id: installationId } = installation // id is gid: number
    const {
      id: senderId,
      node_id: senderNid,
      login: senderLogin
    } = sender
    const {
      id: repoId,
      node_id: repoNid,
      full_name: repoName,
      owner: repoOwner,
    } = repository
    const {
      id: ownerId,
      node_id: ownerNid,
      login: ownerLogin
    } = repoOwner
    const {
      id: prId,
      node_id: prNid,
      number: prNumber,
      state: prState,
      title: prTitle
    } = pull_request

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

    const iid = await this.db.resolveInstallationId(installationId);
    const sid = await this.db.ensureUser({
      gid: senderId,
      nid: senderNid,
      login: senderLogin
    })
    const oid = await this.db.ensureUser({
      gid: ownerId,
      nid: ownerNid,
      login: ownerLogin
    })
    const rid = await this.db.ensureRepo({
      gid: repoId,
      nid: repoNid,
      name: repoName,
      ownerId: oid,
      installationId: iid
    })
    const prid = await this.db.ensurePullRequest({
      gid: prId,
      nid: prNid,
      number: prNumber,
      state: prState,
      repoId: rid,
      senderId: sid,
      installationId: iid
    })
  }  

  async review(context: Context) {
    const { name, event, payload } = context
    const { action, review, pull_request, repository, sender, installation } = payload
    const { id: installationId } = installation // id is gid: number
    const {
      id: reviewId,
      node_id: reviewNid,
      state // commented
    } = review
    const {
      id: senderId,
      node_id: senderNid,
      login: senderLogin
    } = sender
    const {
      id: repoId,
      node_id: repoNid,
      full_name: repoName,
      owner: repoOwner,
    } = repository
    const {
      id: ownerId,
      node_id: ownerNid,
      login: ownerLogin
    } = repoOwner
    const {
      id: prId,
      node_id: prNid,
      number: prNumber,
      state: prState,
      title: prTitle
    } = pull_request

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

    const iid = await this.db.resolveInstallationId(installationId);
    const sid = await this.db.ensureUser({
      gid: senderId,
      nid: senderNid,
      login: senderLogin
    })
    const oid = await this.db.ensureUser({
      gid: ownerId,
      nid: ownerNid,
      login: ownerLogin
    })
    const rid = await this.db.ensureRepo({
      gid: repoId,
      nid: repoNid,
      name: repoName,
      ownerId: oid,
      installationId: iid
    })
    const prid = await this.db.ensurePullRequest({
      gid: prId,
      nid: prNid,
      number: prNumber,
      state: prState,
      repoId: rid,
      senderId: sid,
      installationId: iid
    })

    await this.db.ensureCodeReview({
      gid: reviewId,
      nid: reviewNid,
      state,
      senderId: sid,
      repoId: rid,
      pullRequestId: prid,
      installationId: iid
    })
  }  
}
