import { ModuleStatus } from "./ModuleStatus";
import { Module } from "./Modules";
import { AwaitedReturnType } from "./typesHelper";

/**
 * Object encapsulating information about the context of the execution fo the Module (i.e id, current mainResult, current state)
 *
 * TODO - Refine attributes for the Context
 */
export type Context<T extends Module> = {
  mainResult?: AwaitedReturnType<T["run"]>;
  id: T["id"];
  state: ModuleStatus;
};

export type HookMethod<T extends Module> = (
  context: Context<T>
) => Promise<void>;

export type Hook<T extends Module> = {
  run: HookMethod<T>;
  onState: ModuleStatus;
};
