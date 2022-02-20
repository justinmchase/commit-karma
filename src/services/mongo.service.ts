import { parseConnectionString, MongoClient, Database, Collection, Document } from "../../deps/mongo.ts";

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
    console.log('mongo connecting...')
    const client = new MongoClient()
    const options = await parseConnectionString(connectionString);
    if (connectionString.indexOf('localhost') === -1) {
      options.tls = true
    }

    const db = await client.connect(options)
    console.log('mongo connected')
    return new MongoService(client, db);
  }
}
