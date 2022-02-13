// Deno deploy does not allow sync file reads
// You must use the async api
export { configAsync as dotenv } from "https://deno.land/x/dotenv@v3.1.0/mod.ts";
