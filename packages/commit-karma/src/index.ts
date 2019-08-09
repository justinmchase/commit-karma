// Git Data API use case example
// See: https://developer.github.com/v3/git/ to learn more
import 'source-map-support/register'
import { Context } from 'probot';
import { Database } from './data/database';
import { Suite } from './hooks/suite'
import { Run } from './hooks/run';
import { Installation } from './hooks/installation';
import { PullRequest } from './hooks/pullRequest';

export default async function App(app) {

  const db = new Database()
  await db.init()

  app.on('*', async (context: Context) => {
    const { name, payload: { action } } = context
    context.log({ name, action })
  //   context.log('This is a log.')
  //   context.log.debug('This is debug')
  //   context.log.error('This is an error')
  //   context.log.fatal('This is fatal')
  //   context.log.info('This is info.')
  //   context.log.warn('This is a warning.')
  })

  new Installation(db, app)
  new Suite(db, app)
  new Run(db, app)
  new PullRequest(db, app)

  // app.on('installation', )
// - installation
// - pull_request / synchronize
// - pull_request_review
// - pull_request_review_comment
  // app.on('check_suite', checkSuite)
  // app.on('check_run', checkRun)
}

// Probot uses old module style
module.exports = App

process.on('exit', (code) => console.log('exiting with code:', code))
process.on('uncaughtException', (err) => console.error(err))
process.on('unhandledRejection', err => console.error(err))