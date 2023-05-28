import { ModuleStatus } from "./ModuleStatus";
import { NotVoid } from "./typesHelper";

export type Context<R> = {
  mainResult?: NotVoid<R>;
  state: ModuleStatus;
};

export type HookMethod<R> = (context: Context<R>) => Promise<void>;

export type Hook<R> = {
  run: HookMethod<R>;
  onState: ModuleStatus;
};
