/**
 * Takes a type in template parameter and return never if the type is void | undefined | null
 * Useful if you wish to control a return from a function is defined and valid
 */
export type NotVoid<T> = void extends T
  ? never
  : undefined extends T
  ? never
  : null extends T
  ? never
  : T;

/**
 * Contract the two helper Awaited and ReturnType to obtain the return type of a promise
 * @example AwaitedReturnType<() => Promise<string>> = string
 */
export type AwaitedReturnType<T extends (...args: any[]) => Promise<any>> =
  Awaited<ReturnType<T>>;
