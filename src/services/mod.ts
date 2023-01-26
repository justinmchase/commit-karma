import { dotenv } from "../../deps/dotenv.ts";
import { AnalyticsService } from "./analytics.service.ts";
import { GithubService } from "./github.service.ts";
import { MongoService } from "./mongo.service.ts";

export { GithubService, MongoService, AnalyticsService };

export type Services = {
  env: Record<string, string>;
  mongo: MongoService;
  github: GithubService;
  analytics: AnalyticsService;
};

export async function initServices() {
  const env = {
    ...await dotenv(),
    ...Deno.env.toObject(),
  };
  const mongo = await MongoService.create(env);
  const github = await GithubService.create(env);
  const analytics = await AnalyticsService.create(env);
  return {
    env,
    mongo,
    github,
    analytics
  };
}
