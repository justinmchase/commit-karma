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
  userLogin: string
  score: number
}

export type Karma = {
  kinds: Record<InteractionKind, number>
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
    const interaction = await this.findOne(_id);
    if (!interaction) {
      throw new NotFoundError("Interaction", _id)
    }
    return interaction
  }

  public async searchOne(args: {
    kind: InteractionKind
    id: number
  }): Promise<Interaction> {
    const { kind, id } = args
    const interaction = await this.mongo.interactions.findOne({
      kind,
      id,
    })
    if (!interaction) {
      throw new NotFoundError("Interaction", `${kind}.${id}`)
    }
    return interaction
  }

  public async upsert(data: CreateInteractionInput): Promise<Interaction> {
    const now = new Date()
    const { kind, state, repositoryId, number, id, score, userId, userLogin } = data;
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
            userLogin,
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

  public async calculateKarma(userId: number): Promise<Karma> {
    const [karma] = await this.mongo.interactions.aggregate<Karma>([
      {
        $match: {
          state: State.Active,
          userId
        }
      },
      {
        $facet: {
          kinds: [
            {
              $group: {
                _id: "$kind",
                v: { $sum: 1 },
              }
            },
            {
              $project: {
                _id: 0,
                k: "$_id",
                v: "$v"
              }
            }
          ],
          score: [
            {
              $group: {
                _id: 1,
                score: { $sum: "$score" }
              }
            },
            {
              $unwind: "$score"
            }
          ]
        }
      },
      {
        $unwind: '$score'
      },
      {
        $project: {
          kinds: { $arrayToObject: "$kinds" },
          score: "$score.score"
        }
      }
    ]).toArray()

    return karma ?? { kinds: {}, score: 0 } as Karma
  }
}
