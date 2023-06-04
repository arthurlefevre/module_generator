import { Observer, Subject } from "rxjs";
import { ModuleStatus } from "./ModuleStatus";
import { AwaitedReturnType } from "./typesHelper";
import { Context, Hook } from "./Hooks";

/**
 * Base class for the module like operation
 * Takes an id to identify the module in log
 * Takes dependencies and hooks in the constructor
 *
 * Resolve aroung the Main passed as Template parameter which is an async function
 * The Main is populated by the type of main in the constructor
 * The main in the parameter is enforced to never return void | undefined | null, so that dependencies always have something passed to them in the arg
 *
 * Follow a state machine ModelStatus, with Hook available for every state except for ModelStatus.INITIALIZED
 * Use {@link Module#state} to get a Observable for subscription
 * If you wish to obtain a snapshot of the state, use get stateSnapshot()
 * Hooks are passed in the constructor
 *
 * @example const m = new Module('', () => Promise<string>); (typeof m) === 'Module<() => Promise<string>>'
 */
export class Module<
  Main extends (...args: any[]) => Promise<any> = (
    ...args: any[]
  ) => Promise<any>
> {
  public id: string;
  private _main: Main;
  private _mainResult: AwaitedReturnType<Main> | undefined;
  private _dependencies: BaseDependency<Main>[];
  private _status: Subject<ModuleStatus> = new Subject();
  private _statusSnapshot: ModuleStatus = ModuleStatus.INITIALIZED;
  private _hooks: Hook<Module>[];

  constructor(
    id: string,
    main: PromiseMainMethod<Main>,
    dependencies: BaseDependency<PromiseMainMethod<Main>>[] = [],
    hooks: Hook<Module<Main>>[] = []
  ) {
    this.id = id;
    this._main = main;
    this._dependencies = dependencies;
    this._hooks = hooks as Hook<Module>[];
    this._status.next(ModuleStatus.INITIALIZED);
  }

  private async setStatus(status: ModuleStatus) {
    this._statusSnapshot = status;
    this._status.next(status);
    await Promise.allSettled(
      this._hooks
        .filter((h) => h.onState === this._statusSnapshot)
        .map((h) => h.run(this.context))
    );
  }

  private get context(): Context<Module<Main>> {
    return {
      state: this._statusSnapshot,
      mainResult: this._mainResult,
      id: this.id,
    };
  }

  get status(): {
    subscribe: (
      observer: Observer<ModuleStatus>
    ) => ReturnType<Subject<ModuleStatus>["subscribe"]>;
  } {
    return {
      subscribe: (obs) => this._status.subscribe(obs),
    };
  }

  get statusSnapshot() {
    return this._statusSnapshot;
  }

  async run(
    ...args: Parameters<Main>
  ): Promise<AwaitedReturnType<PromiseMainMethod<Main>> | null> {
    try {
      await this.setStatus(ModuleStatus.RUNNING);
      this._mainResult = await this._main.apply(this._main, args);
      await this.setStatus(ModuleStatus.MAIN_DONE);
      return this._mainResult as AwaitedReturnType<PromiseMainMethod<Main>>;
    } catch (e: unknown) {
      await this.setStatus(ModuleStatus.ERROR);
      return null;
    }
  }

  async runDependencies(): Promise<PromiseSettledResult<any>[]> {
    if (this._statusSnapshot === ModuleStatus.MAIN_DONE) {
      await this.setStatus(ModuleStatus.RUNNING_DEPENDENCIES);
      const res = await Promise.allSettled(
        this._dependencies.map((d) => this.runDependency(d))
      );
      await this.setStatus(ModuleStatus.DONE);
      this._status.complete();
      return res;
    } else {
      throw new Error("The module is already in error");
    }
  }

  private async runDependency(dependency: BaseDependency<Main>): Promise<any> {
    if (dependency instanceof Module) {
      const res = await dependency.run(
        this._mainResult as AwaitedReturnType<Main>
      );
      await dependency.runDependencies();
      return res;
    } else {
      return await dependency(this._mainResult as AwaitedReturnType<Main>);
    }
  }
}

type PromiseMainMethod<T extends Function> = T extends () => Promise<infer R>
  ? void extends R
    ? never
    : undefined extends R
    ? never
    : null extends R
    ? never
    : T
  : never;

export type BaseDependencyMethod<Main extends () => Promise<any>> = (
  arg: AwaitedReturnType<Main>
) => Promise<any>;
export type BaseDependency<Main extends () => Promise<any>> =
  | BaseDependencyMethod<Main>
  | Module<(arg: AwaitedReturnType<Main>) => Promise<any>>;
