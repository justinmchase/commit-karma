import { Status } from "../../deps/oak.ts";
import { ErrorCode } from "./errorCode.ts";

export class ApplicationError extends Error {
  constructor(
    public readonly status: Status,
    public readonly code: ErrorCode,
    message: string,
    public readonly warning?: string,
  ) {
    super(message);
  }
}
