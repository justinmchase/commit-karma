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
    const { installationByRepositoryId } = await this.fauna.query<{ installationByRepositoryId: Installation }>(
      gql`
        query GetInstallationByRepositoryId($repositoryId:Int!) {
          installationByRepositoryId($repositoryId) {
            _id
            _ts
            state
            installationId
            targetId
            targetType
            repositoryId
          }
        }
      `,
      { repositoryId }
    ) ?? {}

    return installationByRepositoryId
  }

  public async create(data: CreateInstallationInput): Promise<Installation> {
    const { installationId, targetId, targetType, repositoryId } = data;
    const { createInstallation } = await this.fauna.query<{ createInstallation: Installation }>(
      gql`
        mutation CreateInstallation(
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

  public async update(
    installation: Installation,
    state: State
  ): Promise<Installation> {
    const { _id, installationId, repositoryId, targetId, targetType } = installation
    const { updateInstallation } = await this.fauna.query<{ updateInstallation: Installation }>(
      gql`
        mutation UpdateInstallation(
          $id: ID!
          $installationId: Int!
          $repositoryId: Int!
          $targetId: Int!
          $targetType: AccountType!
          $state: State!
        ) {
          updateInstallation(
            id: $id
            data: {
              installationId: $installationId
              repositoryId: $repositoryId
              targetId: $targetId
              targetType: $targetType
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
        id: _id,
        installationId,
        repositoryId,
        targetId,
        targetType,
        state
      }
    ) ?? {}

    if (!updateInstallation) {
      throw new Error('failed to create installation')
    }

    return updateInstallation

  }
}
