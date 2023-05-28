import { Observer, Subject } from "rxjs";

/**
 *  Base class for the module like operation
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
  private _statusSnapshot!: ModuleStatus;

  constructor(
    id: string,
    main: PromiseMainMethod<Main>,
    dependencies: BaseDependency<PromiseMainMethod<Main>>[]
  ) {
    this.id = id;
    this._main = main;
    this._dependencies = dependencies;
    this.setStatus(ModuleStatus.INITIALIZED);
  }

  private setStatus(status: ModuleStatus) {
    this._statusSnapshot = status;
    this._status.next(status);
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
      this.setStatus(ModuleStatus.RUNNING);
      this._mainResult = await this._main.apply(this._main, args);
      this.setStatus(ModuleStatus.MAIN_DONE);
      return this._mainResult as AwaitedReturnType<PromiseMainMethod<Main>>;
    } catch (e: unknown) {
      this.setStatus(ModuleStatus.ERROR);
      return null;
    }
  }

  async runDependencies(): Promise<PromiseSettledResult<any>[]> {
    if (this._statusSnapshot === ModuleStatus.MAIN_DONE) {
      this.setStatus(ModuleStatus.RUNNING_DEPENDENCIES);
      const res = await Promise.allSettled(
        this._dependencies.map((d) => this.runDependency(d))
      );
      this.setStatus(ModuleStatus.DONE);
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

export enum ModuleStatus {
  INITIALIZED = 0,
  RUNNING = 1,
  MAIN_DONE = 2,
  RUNNING_DEPENDENCIES = 4,
  DONE = 8,
  ERROR = 16,
}

type AwaitedReturnType<T extends (...args: any[]) => Promise<any>> = Awaited<
  ReturnType<T>
>;
