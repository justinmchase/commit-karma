import { start } from "./src/mod.ts";

try {
  console.log("starting...");
  await start();
} catch (err) {
  console.log({ ...err });
  console.log(err);
}
console.log("done.");
