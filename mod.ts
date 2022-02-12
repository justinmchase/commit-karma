import { serve } from "https://deno.land/std@0.125.0/http/server.ts";

console.log("Listening on http://localhost:8000");
serve((req: Request) => {
  console.log(req)
  return new Response("Hello World!", {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
});
