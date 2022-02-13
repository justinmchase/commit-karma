import { GraphQLClient } from "../../deps/graphql.ts"
import { ISerializable } from "../util/serializable.ts"

export class FaunaService {

  private readonly client: GraphQLClient

  constructor(env: Record<string, string>) {
    const token = env["FAUNA_SECRET"];
    if (!token) {
      throw new Error("environment variable FAUNA_SECRET not set");
    }

    this.client = new GraphQLClient("https://graphql.fauna.com/graphql", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    });
  }

  public async query<T>(
    query: string,
    variables: ISerializable,
  ): Promise<T | undefined> {
    return await this.client.request<T>(query, variables);
  }
}
