import { dotenv } from "../../deps/dotenv.ts";
import { GithubService } from "./github.service.ts";
import { MongoService } from "./mongo.service.ts";

export { GithubService, MongoService };

export type Services = {
  mongo: MongoService;
  github: GithubService;
};

export async function initServices() {
  const env = {
    ...await dotenv(),
    ...Deno.env.toObject(),
  };
  const mongo = await MongoService.create(env);
  const github = await GithubService.create(env);
  return {
    mongo,
    github,
  };
}
