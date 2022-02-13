import { State } from "./state.ts"
import { AccountType } from "./account.ts"

export type Installation = {
  _id: string
  _ts: number
  state: State
  installationId: number
  targetId: number
  targetType: AccountType
  repositoryId: number
}
