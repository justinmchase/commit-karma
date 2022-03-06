import { Status } from "../../deps/oak.ts";
import { ErrorCode } from "./errorCode.ts";
import { ApplicationError } from "./application.error.ts";

export class NotImplementedError extends ApplicationError {
  constructor(
    public readonly message = "not implemented",
  ) {
    super(
      Status.InternalServerError,
      ErrorCode.NotImplemented,
      message,
    );
  }
}
