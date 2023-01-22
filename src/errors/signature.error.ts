import { Status } from "../../deps/oak.ts";
import { ErrorCode } from "./errorCode.ts";
import { ApplicationError } from "./application.error.ts";

export class SignatureError extends ApplicationError {
  constructor(details?: string) {
    super(
      Status.Unauthorized,
      ErrorCode.Signature,
      "invalid signature",
      details
    )
  }
}