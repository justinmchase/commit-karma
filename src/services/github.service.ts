import { Status } from "../../deps/oak.ts";
import { appJwt, createInstallationToken } from "../../deps/github.ts"
import {
  GithubCheckRunStatus,
  GithubCheckRunConclusion,
  IGithubCreateCheckRun,
} from "../schema/github.ts"
import { UnexpectedStatusError } from "../errors/mod.ts"

export class GithubService {

  constructor(
    private readonly appId: number,
    private readonly privateKey: string,
  ) {
  }

  public static async create(env: Record<string, string>) {
    // commit-karma appId, should not ever change
    const appId = parseInt(env["APP_ID"] ?? "37724");

    // cat commit-karma.pem | base64
    const privateKey = env["GITHUB_PRIVATE_KEY"];

    if (!Deno.permissions) {
      // todo: remove this hack once the following issue is resolved
      // https://github.com/laughedelic/github_app_auth/issues/6
      (Deno as unknown as Record<string, unknown>)['permissions'] = {
        query: async () => await true
      }
      console.log('Deno.permissions patched')
    }

    return await new GithubService(appId, privateKey);
  }

  private async token(installationId: number): Promise<string> {
    // todo: cache the token for a minute at least to reduce calls to this api
    const jwt = await appJwt(`${this.appId}`, this.privateKey)
    const { token } = await createInstallationToken(
      jwt,
      `${installationId}`,
    );
    return token
  }

  public async createCheckRun(args: {
    installationId: number,
    repositoryName: string,
    repositoryOwner: string
    commit: string,
  }) {
    const { installationId, repositoryName, repositoryOwner, commit } = args
    const now = new Date()
    const checkRun: IGithubCreateCheckRun = {
      name: 'commit-karma',
      head_sha: commit,
      // external_id: todo: mongo record _id ?
      // details_url: todo: send to a page that renders karma details?
      status: GithubCheckRunStatus.Completed,
      started_at: now.toISOString(),
      completed_at: now.toISOString(),
      conclusion: GithubCheckRunConclusion.Success,
      output: {
        title: 'commit-karma',
        summary: '@justinmchase has good karma!',
        text: `
        # Summary
        +10 karma
        10 repos
        100 code reviews
        1000 issues
        `,
        annotations: [],
        images: []
      },
      actions: []
    }

    const token = await this.token(installationId);
    const json = JSON.stringify(checkRun)
    const res = await fetch(`https://api.github.com/repos/${repositoryOwner}/${repositoryName}/check-runs`, {
      method: "POST",
      headers: new Headers({
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Length": `${json.length}`,
      }),
      body: json
    })

    const { ok, status } = res
    if (!ok || status != Status.Created) {
      throw new UnexpectedStatusError(Status.Created, status);
    }
  }
}
