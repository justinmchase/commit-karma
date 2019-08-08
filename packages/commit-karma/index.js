// Git Data API use case example
// See: https://developer.github.com/v3/git/ to learn more
const uuid = require('uuid/v4')

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  // app.on('*', async (context) => {
  //   const { github, ...rest } = context
  //   console.log(rest)
  // })

  app.on('check_suite', async (context) => {
    await context.github.checks.create({
      name: 'Commit Karma',
      head_sha: context.payload.check_suite.head_sha,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      ...context.repo(),
    })
  })

  app.on('check_run', async (context) => {
    if (context.payload.action === 'created' || context.payload.action === 'rerequested') {
      const { github, payload, ...rest } = context
      const { sender: { login } } = payload
      const index = {
        requests: {},
        reviews: {}
      }

      const pulls = await context.github.pullRequests.list({
        ...context.repo(),
        page: 0,
        per_page: 1
      })

      for (const pull of pulls.data) {
        const { number, user: { login } } = pull

        if (!index.requests[login]) index.requests[login] = 0
        index.requests[login]++

        const reviews = await context.github.pullRequests.listReviews({
          ...context.repo(),
          number,
          page: 0,
          per_page: 1
        })

        for (const review of reviews.data) {
          const { user: { login } } = review
          if (!index.reviews[login]) index.reviews[login] = 0
          index.reviews[login]++
        }
      }

      const req = index.requests[login] || 0
      const rev = index.reviews[login] || 0

      const passed = rev >= req

      await context.github.checks.update({
        check_run_id: context.payload.check_run.id,
        status: 'completed',
        conclusion: passed ? 'success' : 'failure',
        completed_at: new Date().toISOString(),
        ...context.repo(),
        output: {
          title: 'Postivie Karma Required',
          summary: 'Give code reviews to get postive karma',
          text: '# Requester Karma review\n' +
                `- ${login} has given ${rev} code review\n` +
                `- ${login} has made ${req} pull requests\n` +
                '\n' +
                '**Thank you!**'
        }
      })
    }
  })
}
