import { ObjectId } from "../../deps/mongo.ts";
import { NotFoundError } from "../errors/mod.ts";
import { MongoService } from "../services/mongo.service.ts";
import {
  State,
  AccountType,
  Installation,
} from "../data/mod.ts";

type CreateInstallationInput = {
  installationId: number
  targetId: number
  targetType: AccountType
  repositoryId: number
}

export class InstallationManager {
  constructor(
    private readonly mongo: MongoService,
  ) { }

  // createInstallation(
  //   # 'Installation' input values
  //   data: InstallationInput!
  // ): Installation!

  // # Update an existing document in the collection of 'Installation'
  // updateInstallation(
  //   # The 'Installation' document's ID
  //   id: ID!

  //   # 'Installation' input values
  //   data: InstallationInput!
  // ): Installation


  // installationId: Int!
  // targetId: Int!
  // targetType: AccountType!
  // repositoryId: Int!
  // state: State!

  public async byRepositoryId(repositoryId: number): Promise<Installation | undefined> {
    return await this.mongo.installations.findOne({
      repositoryId
    })
  }

  public async findOne(_id: string | ObjectId): Promise<Installation | undefined> {
    return await this.mongo.installations.findOne({ _id })
  }

  public async get(_id: string | ObjectId): Promise<Installation> {
    const installation = await this.findOne(_id);
    if (!installation) {
      throw new NotFoundError("Installation", _id)
    }
    return installation
  }

  public async create(data: CreateInstallationInput): Promise<Installation> {
    const now = new Date()
    const { installationId, repositoryId, targetId, targetType } = data;
    const createdId = await this.mongo.installations.insertOne(
      {
        installationId,
        repositoryId,
        targetId,
        targetType,
        state: State.Active,
        _ts: now.getTime(),
      }
    )

    if (!createdId) {
      throw new Error('failed to create installation')
    }

    return await this.get(createdId)
  }

  public async setState(
    installation: Installation,
    state: State
  ): Promise<Installation> {
    const { _id } = installation
    await this.mongo.installations.updateOne(
      { _id },
      {
        $set: {
          state
        }
      }
    );
    return this.get(_id);
  }
}
