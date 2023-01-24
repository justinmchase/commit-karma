import { ObjectId } from "../../deps/mongo.ts";
import { NotFoundError } from "../errors/mod.ts";
import { MongoService } from "../services/mongo.service.ts";
import { Installation, State } from "../data/mod.ts";
import { GithubAccountType } from "../schema/github.ts";

type InstallArgs = {
  installationId: number;
  targetId: number;
  targetType: GithubAccountType;
  repositoryId: number;
  repositoryName: string;
};

type UninstallArgs = {
  installationId: number;
  targetId: number;
  repositoryId: number;
};

export class InstallationManager {
  constructor(
    private readonly mongo: MongoService,
  ) {}

  public async init() {
    await this.mongo.installations.createIndexes({
      indexes: [
        {
          name: "installationId_repositoryId_targetId",
          key: {
            installationId: -1,
            repositoryId: -1,
            targetId: -1,
          }
        }
      ]
    })
  }

  public async byRepositoryId(
    repositoryId: number,
  ): Promise<Installation | undefined> {
    return await this.mongo.installations.findOne({
      repositoryId,
    });
  }

  public async findOne(
    _id: string | ObjectId,
  ): Promise<Installation | undefined> {
    return await this.mongo.installations.findOne({ _id });
  }

  public async get(_id: string | ObjectId): Promise<Installation> {
    const installation = await this.findOne(_id);
    if (!installation) {
      throw new NotFoundError("Installation", _id);
    }
    return installation;
  }

  public async install(data: InstallArgs): Promise<Installation> {
    const now = new Date();
    const {
      installationId,
      targetId,
      targetType,
      repositoryId,
      repositoryName,
    } = data;
    const installation = await this.mongo.installations.findAndModify(
      {
        installationId,
        repositoryId,
        targetId,
      },
      {
        new: true,
        upsert: true,
        update: {
          $set: {
            installationId,
            targetId,
            targetType,
            repositoryId,
            repositoryName,
            state: State.Active,
            _ts: now.getTime(),
          },
        },
      },
    );

    if (!installation) {
      // todo: make a better error
      throw new Error("failed to install");
    }

    return installation;
  }

  public async uninstall(data: UninstallArgs): Promise<Installation> {
    const now = new Date();
    const { installationId, targetId, repositoryId } = data;
    const installation = await this.mongo.installations.findAndModify(
      {
        installationId,
        repositoryId,
        targetId,
      },
      {
        new: true,
        upsert: true,
        update: {
          $set: {
            state: State.Deleted,
            _ts: now.getTime(),
          },
        },
      },
    );

    if (!installation) {
      // todo: make a better error
      throw new Error("failed to uninstall");
    }

    return installation;
  }

  public async setState(
    installation: Installation,
    state: State,
  ): Promise<Installation> {
    const { _id } = installation;
    await this.mongo.installations.updateOne(
      { _id },
      {
        $set: {
          state,
        },
      },
    );
    return this.get(_id);
  }
}
