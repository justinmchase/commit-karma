import { gql } from "../../deps/graphql.ts"
import { FaunaService } from "../services/fauna.service.ts";
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
  constructor(private readonly fauna: FaunaService) { }

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
    const res = await this.fauna.query<{ installationsByRepository: { data: Installation[] } }>(
      gql`
        query InstallationGetByRepositoryId($repositoryId:Int!) {
          installationsByRepository(repositoryId: $repositoryId) {
            data {
              _id
              _ts
              state
              installationId
              targetId
              targetType
              repositoryId
            }
          }
        }
      `,
      { repositoryId }
    )

    return res?.installationsByRepository?.data?.[0];
  }

  public async create(data: CreateInstallationInput): Promise<Installation> {
    const { installationId, targetId, targetType, repositoryId } = data;
    const { createInstallation } = await this.fauna.query<{ createInstallation: Installation }>(
      gql`
        mutation InstallationCreate(
          $installationId: Int!
          $targetId: Int!
          $targetType: AccountType!
          $repositoryId: Int!
          $state: State!
        ) {
          createInstallation(
            data: {
              installationId: $installationId
              targetId: $targetId
              targetType: $targetType
              repositoryId: $repositoryId
              state: $state
            }
          ) {
            _id
            installationId
            targetId
            targetType
            repositoryId
            state
          }
        }
      `,
      {
        installationId,
        targetId,
        targetType,
        repositoryId,
        state: State.Active
      }
    ) ?? {}

    if (!createInstallation) {
      throw new Error('failed to create installation')
    }

    return createInstallation
  }

  public async setState(
    installation: Installation,
    state: State
  ): Promise<Installation> {
    const { _id } = installation
    const { partialUpdateInstallation } = await this.fauna.query<{ partialUpdateInstallation: Installation }>(
      gql`
        mutation InstallationSetState(
          $id: ID!
          $state: State!
        ) {
          partialUpdateInstallation(
            id: $id
            data: {
              state: $state
            }
          ) {
            _id
            state
          }
        }
      `,
      {
        id: _id,
        state
      }
    ) ?? {}

    if (!partialUpdateInstallation) {
      throw new Error('failed to create installation')
    }

    return partialUpdateInstallation
  }
}
