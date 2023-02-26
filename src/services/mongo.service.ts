import { ILoggingService } from "../../deps/grove.ts";
import {
  Collection,
  Database,
  MongoClient,
  parseConnectionString,
} from "../../deps/mongo.ts";
import { Installation, Interaction } from "../data/mod.ts";

export class MongoService {
  public readonly installations: Collection<Installation>;
  public readonly interactions: Collection<Interaction>;
  constructor(
    private readonly client: MongoClient,
    private readonly db: Database,
  ) {
    this.installations = db.collection("installations");
    this.interactions = db.collection("interactions");
  }

  public static async create(
    env: Record<string, string>,
    logging: ILoggingService,
  ) {
    const connectionString = env["MONGO_CONNECTION_STRING"];
    if (!connectionString) {
      logging.warn(
        "mongo",
        "MONGO_CONNECTION_STRING not found. Please create a .env file or set up your environment correctly.",
      );
    }

    const client = new MongoClient();
    const options = await parseConnectionString(connectionString);
    if (connectionString.indexOf("localhost") === -1) {
      options.tls = true;
    }
    const db = await client.connect(options);
    logging.info(
      `mongo`,
      "mongo connected",
    );
    return new MongoService(client, db);
  }
}
