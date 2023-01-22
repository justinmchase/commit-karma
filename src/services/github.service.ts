import { Request, Status } from "../../deps/oak.ts";
import { appJwt, createInstallationToken } from "../../deps/github.ts";
import {
  GithubCheckRunConclusion,
  GithubCheckRunStatus,
  IGithubCreateCheckRun,
} from "../schema/github.ts";
import { InteractionKind, InteractionScore } from "../data/interaction.ts";
import { Karma } from "../managers/interaction.manager.ts";
import { UnexpectedStatusError } from "../errors/mod.ts";
import { SignatureError } from "../errors/signature.error.ts";
import { hexToUint8 } from "../util/hex.ts";

export class GithubService {
  private cryptoKey?: CryptoKey;
  constructor(
    private readonly appId: number,
    private readonly privateKey: string,
    private readonly webhookSecret?: string,
  ) {
  }

  public static async create(env: Record<string, string>) {
    // commit-karma appId, should not ever change
    const appId = parseInt(env["APP_ID"] ?? "37724");

    // cat commit-karma.pem | base64
    const privateKey = env["GITHUB_PRIVATE_KEY"];

    // This can be any guid, it needs to be configured here as well as in the github app
    const webhookSecret = env["GITHUB_WEBHOOK_SECRET"];

    if (!Deno.permissions) {
      // todo: remove this hack once the following issue is resolved
      // https://github.com/laughedelic/github_app_auth/issues/6
      (Deno as unknown as Record<string, unknown>)["permissions"] = {
        query: async () => await true,
      };
      console.log("Deno.permissions patched");
    }

    return await new GithubService(appId, privateKey, webhookSecret);
  }

  public async init() {
    if (this.webhookSecret) {
      console.log("webhook signature verification is enabled");
      const key = new TextEncoder().encode(this.webhookSecret);
      this.cryptoKey = await crypto.subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
      );
    } else {
      console.log(`webhook signature verification is not enabled`);
    }
  }

  public async verify(req: Request) {
    if (this.cryptoKey) {
      const signature = req.headers.get("X-Hub-Signature-256");
      if (!signature) {
        throw new SignatureError("invalid signature");
      }
      const [, sig] = signature.split("=");
      const verified = await crypto.subtle.verify(
        { name: "HMAC" },
        this.cryptoKey,
        hexToUint8(sig),
        await req.body({ type: "bytes" }).value,
      );
      if (!verified) {
        throw new SignatureError("could not verify signature");
      }
    }
  }

  private async token(installationId: number) {
    if (!this.appId || !this.privateKey) {
      return undefined;
    }

    // todo: cache the token for a minute at least to reduce calls to this api
    const jwt = await appJwt(`${this.appId}`, this.privateKey);
    const { token } = await createInstallationToken(
      jwt,
      `${installationId}`,
    );
    return token;
  }

  private static getKarmaPhrase(score: number) {
    if (score > 100) {
      return "great karma!";
    } else if (score > 0) {
      return "good karma!";
    } else if (score < -100) {
      return "bad karma...";
    } else {
      return "neutral karma.";
    }
  }

  private static getKarmaConclusion(score: number) {
    if (score > 0) {
      return GithubCheckRunConclusion.Success;
    } else if (score < -100) {
      return GithubCheckRunConclusion.Failure;
    } else {
      return GithubCheckRunConclusion.Neutral;
    }
  }

  private static getKindPhrase(kind: InteractionKind) {
    switch (kind) {
      case InteractionKind.PullRequest:
        return "Pull Requests";
      case InteractionKind.Issue:
        return "Issues";
      case InteractionKind.Comment:
        return "Comments";
      case InteractionKind.Review:
        return "Reviews";
      case InteractionKind.Merged:
        return "Merged Pull Requests";
      default:
        return "Unknown";
    }
  }

  public async createCheckRun(args: {
    installationId: number;
    userLogin: string;
    repositoryName: string;
    repositoryOwner: string;
    commit: string;
    karma: Karma;
  }) {
    const {
      installationId,
      userLogin,
      repositoryName,
      repositoryOwner,
      commit,
      karma,
    } = args;
    const { kinds, score } = karma;
    const entries = Object.entries(kinds) as [InteractionKind, number][];
    const now = new Date();
    const renderLine = (kind: InteractionKind, count: number) => {
      const kindPhrase = GithubService.getKindPhrase(kind as InteractionKind);
      const scoreSum = InteractionScore[kind] * count;
      return `| ${kindPhrase} | ${count} | ${scoreSum} |`;
    };

    const checkRun: IGithubCreateCheckRun = {
      name: "commit-karma",
      head_sha: commit,
      status: GithubCheckRunStatus.Completed,
      started_at: now.toISOString(),
      completed_at: now.toISOString(),
      conclusion: GithubService.getKarmaConclusion(score),
      output: {
        title: "commit-karma",
        summary: `@${userLogin} has ${GithubService.getKarmaPhrase(score)}`,
        text: `| kinds | count | total |
| ----- | ----- | ----- |
${entries.map(([kind, count]) => renderLine(kind, count)).join("\n")}
|       |       | ${score} |`,
        annotations: [],
        images: [],
      },
      actions: [],
    };

    const token = await this.token(installationId);
    const json = JSON.stringify(checkRun);
    const res = await fetch(
      `https://api.github.com/repos/${repositoryOwner}/${repositoryName}/check-runs`,
      {
        method: "POST",
        headers: new Headers({
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Length": `${json.length}`,
        }),
        body: json,
      },
    );

    const { ok, status } = res;
    if (!ok || status != Status.Created) {
      throw new UnexpectedStatusError(Status.Created, status);
    }
  }
}
