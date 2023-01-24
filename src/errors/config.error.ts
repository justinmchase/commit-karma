import { Status } from "../../deps/oak.ts";
import { ApplicationError } from "./application.error.ts";
import { ErrorCode } from "./errorCode.ts";

export class ConfigError extends ApplicationError {
  constructor(
    public readonly key: string,
    public readonly reason: string,
  ) {
    super(
      Status.BadRequest,
      ErrorCode.Configuration,
      `invalid configuration. key ${key} ${reason}`
    )
  }
}