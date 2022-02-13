import { dotenv } from "../../deps/dotenv.ts";
import { FaunaService } from "./fauna.service.ts";

export {
  FaunaService
}

export type Services = {
  fauna: FaunaService
}

export async function initServices() {
  const env = {
    ...await dotenv(),
    ...Deno.env.toObject()
  }
  const fauna = new FaunaService(env)
  return {
    fauna
  }
}
