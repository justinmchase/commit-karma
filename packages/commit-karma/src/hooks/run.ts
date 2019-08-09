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
    const { action, sender, installation, repository, check_run } = payload


    if (action === 'created' || action === 'rerequested') {
      const { id: installationId } = installation
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
        id: runId,
        node_id: runNid,
        status: runStatus,
        check_suite: suite,
        pull_requests: pullRequests
      } = check_run
      const {
        id: suiteId,
        node_id: suiteNid,
        head_branch: suiteBranch
      } = suite

      // Ensure objects...
      const iid = await this.db.resolveInstallationId(installationId)
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
        branch: suiteBranch,
        pullRequestIds,
        installationId: iid
      })

      const { pr, cr } = await this.db.calculateKarma(sid)
      const karma = cr - pr
      const conclusion = karma < 0 ? RunConclusion.Fail : RunConclusion.Pass
      const ruid = await this.db.ensureRun({
        gid: runId,
        nid: runNid,
        senderId: sid,
        repoId: rid,
        suiteId: suid,
        installationId: iid,
        status: RunStatus.Completed,
        conclusion,
        karma
      })
      
      await context.github.checks.update({
        check_run_id: context.payload.check_run.id,
        status: RunStatus.Completed,
        conclusion: conclusion,
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
    } else if (action === 'completed') {
      context.log.error({
        name,
        action
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

//       const { github, payload, ...rest } = context
//       const { sender: { login } } = payload
//       const index = {
//         requests: {},
//         reviews: {}
//       }

//       const pulls = await context.github.pullRequests.list({
//         ...context.repo(),
//         page: 0,
//         per_page: 1
//       })

//       for (const pull of pulls.data) {
//         const { number, user: { login } } = pull

//         if (!index.requests[login]) index.requests[login] = 0
//         index.requests[login]++

//         const reviews = await context.github.pullRequests.listReviews({
//           ...context.repo(),
//           number,
//           page: 0,
//           per_page: 1
//         })

//         for (const review of reviews.data) {
//           const { user: { login } } = review
//           if (!index.reviews[login]) index.reviews[login] = 0
//           index.reviews[login]++
//         }
//       }

//       const req = index.requests[login] || 0
//       const rev = index.reviews[login] || 0

//       const passed = rev >= req

//     }
//   }
// }