import { MongoClient, Database, Collection, Document } from "../../deps/mongo.ts";

export class MongoService {
  public readonly installations: Collection<Document>
  public readonly interactions: Collection<Document>
  constructor(
    private readonly client: MongoClient,
    private readonly db: Database,
  ) {

    this.installations = db.collection('installations')
    this.interactions = db.collection('interactions')
  }

  public static async create(env: Record<string, string>) {
    const connectionString = env["MONGO_CONNECTION_STRING"]
    const client = new MongoClient()
    const db = await client.connect(connectionString)
    console.log('mongo connected')
    return new MongoService(client, db);
  }
}
