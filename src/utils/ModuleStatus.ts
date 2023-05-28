export enum ModuleStatus {
  INITIALIZED = 0,
  RUNNING = 1,
  MAIN_DONE = 2,
  RUNNING_DEPENDENCIES = 4,
  DONE = 8,
  ERROR = 16,
}
