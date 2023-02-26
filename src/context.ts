import { IContext, IState } from "#grove/mod.ts";
import { Services } from "./services/mod.ts";
import { Managers } from "./managers/mod.ts";

export interface Context extends IContext<Services> {
  managers: Managers;
}

export interface State extends IState<Services, Context> {
  dummy?: string;
}
