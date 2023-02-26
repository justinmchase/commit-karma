import {
  AggregateLoggingService,
  AzureLoggingService,
  ConsoleLoggingService,
  ILoggingService,
  IServices,
} from "../../deps/grove.ts";
import { dotenv } from "../../deps/dotenv.ts";
import { GithubService } from "./github.service.ts";
import { MongoService } from "./mongo.service.ts";

export { GithubService, MongoService };

export interface Services extends IServices {
  logging: ILoggingService;
  env: Record<string, string>;
  mongo: MongoService;
  github: GithubService;
}

export async function initServices() {
  const env = {
    ...await dotenv(),
    ...Deno.env.toObject(),
  };
  const consoleLogging = new ConsoleLoggingService();
  const azureLogging = await AzureLoggingService.create(env);
  const logging = new AggregateLoggingService(consoleLogging, azureLogging);
  const mongo = await MongoService.create(env, logging);
  const github = await GithubService.create(env);
  return {
    env,
    mongo,
    github,
    logging,
  };
}
