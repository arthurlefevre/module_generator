export type NotVoid<T> = void extends T
  ? never
  : undefined extends T
  ? never
  : null extends T
  ? never
  : T;

export type AwaitedReturnType<T extends (...args: any[]) => Promise<any>> =
  Awaited<ReturnType<T>>;
