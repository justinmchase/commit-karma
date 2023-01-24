import { ISerializable } from "../util/serializable.ts";
import { base64Encode } from "../../deps/std.ts";
import { Status } from "../../deps/oak.ts";
import { hmacCreateKey, hmacSign } from "../util/hmac.ts";
import { UnexpectedStatusError } from "../errors/unexpectedStatus.error.ts";
import { readRequiredString } from "../util/config.ts";

const IdentifierPattern = /^[a-z_]{3,32}$/;

export interface IAnalyticsEvent {
  event: string,
  action: string,
  data: ISerializable
}

export class AnalyticsService {
  constructor(
    private readonly workspaceId: string,
    private readonly cryptoKey: CryptoKey,
  ) {
  }

  public static async create(env: Record<string, string>) {
    const workspaceId = readRequiredString(env, 'AZURE_ANALYTICS_WORKSPACE_ID');
    const secret = readRequiredString(env, 'AZURE_ANALYTICS_WORKSPACE_SECRET');
    const key = await hmacCreateKey(secret);
    return new AnalyticsService(workspaceId, key);
  }

  public async send(arg: IAnalyticsEvent) {
    const { event, action } = arg;
    if (!event.match(IdentifierPattern)) {
      throw new Error(`invalid event. ${event} does not match ${IdentifierPattern}`);
    }
    if (!action.match(IdentifierPattern)) {
      throw new Error(`invalid action ${action} does not match ${IdentifierPattern}`)
    }
    const json = JSON.stringify([{
      event,
      action,
    }]);
    const content = new TextEncoder().encode(json);
    const xMsDate = new Date().toUTCString();

    // e.g. POST\n1024\napplication/json\nx-ms-date:Mon, 04 Apr 2016 08:00:00 GMT\n/api/logs
    const stringToSign = [
      "POST",
      content.length,
      "application/json",
      `x-ms-date:${xMsDate}`,
      "/api/logs",
    ].join("\n");

    // Signature=Base64(HMAC-SHA256(UTF8(StringToSign)))
    const signature = await hmacSign(this.cryptoKey, stringToSign);
    const encodedSignature = base64Encode(signature);
    const headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": `SharedKey ${this.workspaceId}:${encodedSignature}`,
      "Log-Type": "CommitKarma",
      "x-ms-date": xMsDate,
      "time-generated-field": xMsDate,
    });
    
    const url = `https://${this.workspaceId}.ods.opinsights.azure.com/api/logs?api-version=2016-04-01`;
    const res = await fetch(
      url,
      {
        method: "POST",
        headers,
        body: content
      }
    )

    const { ok, status } = res;
    if (!ok || status !== Status.OK) {
      throw new UnexpectedStatusError(Status.OK, status);
    } else {
      console.log('analytics sent')
    }
  }
}