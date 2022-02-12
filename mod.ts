if (import.meta.main) {
  try {
    console.log("starting...");
    const { start } = await import("./src/mod.ts");
    await start();
  } catch (err) {
    console.log({ ...err });
    console.log(err);
  }
  console.log("done.");
}
