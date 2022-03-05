import { ObjectId } from "../../deps/mongo.ts";
import { NotFoundError } from "../errors/mod.ts";
import { MongoService } from "../services/mongo.service.ts";
import {
  State,
  Interaction,
  InteractionKind,
} from "../data/mod.ts";

type CreateInteractionInput = {
  kind: InteractionKind
  state: State
  repositoryId: number
  number: number
  id: number
  userId: number
  score: number
}

export class InteractionManager {
  constructor(
    private readonly mongo: MongoService,
  ) { }

  public async findOne(_id: string | ObjectId): Promise<Interaction | undefined> {
    return await this.mongo.interactions.findOne({ _id })
  }

  public async get(_id: string | ObjectId): Promise<Interaction> {
    const installation = await this.findOne(_id);
    if (!installation) {
      throw new NotFoundError("Installation", _id)
    }
    return installation
  }

  public async upsert(data: CreateInteractionInput): Promise<Interaction> {
    const now = new Date()
    const { kind, state, repositoryId, number, id, score, userId } = data;
    const interaction = await this.mongo.interactions.findAndModify(
      {
        kind,
        repositoryId,
        number,
        id,
        userId
      },
      {
        new: true,
        upsert: true,
        update: {
          $set: {
            state,
            _ts: now.getTime(),
            score,
          },
          $setOnInsert: {
            kind,
            repositoryId,
            number,
            id,
            userId
          }
        }
      }
    )

    if (!interaction) {
      throw new Error('failed to create interaction')
    }

    return interaction;
  }
}
