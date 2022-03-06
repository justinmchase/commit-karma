import { Status } from "../../deps/oak.ts";
import { ErrorCode } from "./errorCode.ts";
import { ApplicationError } from "./application.error.ts";

export class UnexpectedStatusError extends ApplicationError {
  constructor(
    public readonly expectedStatus: Status,
    public readonly actualStatus: Status,
  ) {
    super(
      Status.InternalServerError,
      ErrorCode.UnexpectedStatus,
      `unexpected status ${actualStatus} was received, ${expectedStatus} was expected`,
    );
  }
}
