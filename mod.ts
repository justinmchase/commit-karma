import { start } from "./src/mod.ts";

if (import.meta.main) {
  try {
    await start();
  } catch (err) {
    console.log({ ...err });
    console.log(err);
  }
  console.log("done.");
}
