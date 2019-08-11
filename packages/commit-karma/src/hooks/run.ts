import { Database, RunStatus, RunConclusion } from "../data/database";
import { Application, Context } from "probot";

export class Run {
  constructor(
    private readonly db: Database,
    private readonly app: Application
  ) {
    this.app.on('check_run', this.check.bind(this))
  }
  async check(context: Context) {
    const { name, payload } = context
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
      check_run: {
        id: ruid,
        node_id: runid,
        status: runStatus,
        pull_requests: pullRequests,
        check_suite: {
          id: suid,
          node_id: sunid,
          head_sha: head,
          head_branch: suiteBranch
        },
      },
      installation: {
        id: iid
      },
    } = payload
    const installationId = await this.db.resolveInstallationId(iid)
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

    const prIds = await this.db.resolvePullRequestIds(pullRequests.map(pr => pr.id))
    const suiteId = await this.db.ensureSuite({
      gid: suid,
      nid: sunid,
      branch: suiteBranch,
      head,
      prIds,
      installationId: iid
    })

    if (action === 'created' || action === 'rerequested') {
      const { pr, cr } = await this.db.calculateKarma(senderId)
      const karma = cr - pr
      const conclusion = karma > 0 ? RunConclusion.Pass : RunConclusion.Fail
      const runId = await this.db.ensureRun({
        gid: ruid,
        nid: runid,
        status: RunStatus.Completed,
        conclusion,
        karma,
        senderId,
        repoId,
        suiteId,
        installationId,
      })
      
      await context.github.checks.update({
        check_run_id: context.payload.check_run.id,
        status: RunStatus.Completed,
        conclusion,
        completed_at: new Date().toISOString(),
        ...context.repo(),
        output: {
          title: 'Postivie Karma Required',
          summary: 'Give code reviews to get postive karma',
          text: '# Requester Karma review\n' +
                `- ${senderLogin} has given ${cr} code review\n` +
                `- ${senderLogin} has made ${pr} pull requests\n` +
                `- ${senderLogin} has ${karma} karma!` +
                '\n' +
                '**Thank you!**'
        }
      })
      
      context.log.info({
        name,
        action,
        runId,
        conclusion,
        karma,
        senderId,
        repoId,
        suiteId,
        installationId
      })
    } else if (action === 'completed') {
      context.log.info({
        name,
        action,
        runStatus
      })
    } else {
      context.log.error({
        name,
        action,
        message: 'Unknown action for Run'
      })
    }
  }
}
