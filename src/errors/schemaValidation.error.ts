import { Status } from "../../deps/oak.ts";
import { ErrorCode } from "./errorCode.ts";
import { ApplicationError } from "./application.error.ts";
import { Schema } from "../../deps/jtd.ts";

export class SchemaValidationError extends ApplicationError {
  constructor(
    public readonly type: string,
    public readonly instancePath: string[],
    public readonly schemaPath: string[],
    public readonly schema: Schema,
  ) {
    super(
      Status.InternalServerError,
      ErrorCode.SchemaValidation,
      `schema validation for ${type} failed unexpectedly`,
    );
  }
}
