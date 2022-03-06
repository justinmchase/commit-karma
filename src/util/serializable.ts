export type Serializable =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | { toJson: () => string }
  | { toString(): () => string }
  | ISerializable
  | Array<Serializable>;

export interface ISerializable {
  [key: string]: Serializable;
}
