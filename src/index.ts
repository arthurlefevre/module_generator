import { Observer } from "rxjs";
import { Module, ModuleStatus } from "./utils/Modules";

async function main(): Promise<string> {
  console.log("Running main");

  return "H";
}

function sleep(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
}

const m = new Module("test", main, [sleep]);
const m3 = new Module("test", main, []);
const m2 = new Module("test2", main, [m, m3]);

const obs1: Observer<ModuleStatus> = {
  next(value) {
    console.log(`Status m1 : ${value}`);
  },
  complete() {
    console.log(m.id);
  },
  error(err) {
    console.error(err);
  },
};
const obs2: Observer<ModuleStatus> = {
  next(value) {
    console.log(`Status m2 : ${value}`);
  },
  complete() {
    console.log(m.id);
  },
  error(err) {
    console.error(err);
  },
};
const obs3: Observer<ModuleStatus> = {
  next(value) {
    console.log(`Status m3 : ${value}`);
  },
  complete() {
    console.log(m.id);
  },
  error(err) {
    console.error(err);
  },
};

m.status.subscribe(obs1);
m2.status.subscribe(obs2);
m3.status.subscribe(obs3);

m2.run().then((v) => {
  console.log(v);
  m2.runDependencies();
});
