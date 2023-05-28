import { Observer } from "rxjs";
import { Module, ModuleStatus } from "./utils/Modules";

async function main(): Promise<undefined> {
  console.log("Running main");

  return;
}

const m = new Module("test", main, []);

const obs: Observer<ModuleStatus> = {
  next(value) {
    console.log(`Status : ${value}`);
  },
  complete() {
    console.log(m.id);
  },
  error(err) {
    console.error(err);
  },
};

m.status.subscribe(obs);

m.run().then((v) => {
  console.log(v);
  m.runDependencies();
});
