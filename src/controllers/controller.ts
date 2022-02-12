import { Application } from "../../deps/oak.ts";
import { IContext } from "./context.ts";

export abstract class Controller {
  public abstract use(app: Application<IContext>): Promise<void>;
}
