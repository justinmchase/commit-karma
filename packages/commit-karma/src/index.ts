// Git Data API use case example
// See: https://developer.github.com/v3/git/ to learn more
import 'source-map-support/register'
import { Context } from 'probot';
import { Database } from './data/database';
import { Suite } from './hooks/suite'
import { Run } from './hooks/run';
import { Installation } from './hooks/installation';
import { PullRequest } from './hooks/pullRequest';
import { Review } from './hooks/review';

export default async function App(app) {

  const db = new Database()
  await db.init()

  // app.on('*', async (context: Context) => {
  //   const { name, payload: { action } } = context
  //   context.log({ name, action })
  // })

  new Installation(db, app)
  new Suite(db, app)
  new Run(db, app)
  new PullRequest(db, app)
  new Review(db, app)

// - installation
// - pull_request
// - pull_request_review
// - pull_request_review_comment
}

// Probot uses old module style
module.exports = App

process.on('exit', (code) => console.log('exiting with code:', code))
process.on('uncaughtException', (err) => console.error(err))
process.on('unhandledRejection', err => console.error(err))