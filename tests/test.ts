
import { assertObjectMatch, readableStreamFromReader } from "../deps/std.ts";

const testCases = [
  { event: 'installation', action: 'created' },
  { event: 'installation', action: 'deleted' },
  { event: 'installation-repositories', action: 'added' },
  { event: 'installation-repositories', action: 'removed' },
  { event: 'issue-comment', action: 'created', number: 0 },
  { event: 'issue-comment', action: 'created', number: 1 },
  { event: 'issue-comment', action: 'edited' },
  { event: 'pull-request', action: 'edited' },
]

for (const { event, action, number } of testCases) {
  Deno.test({
    name: `${event} ${action} ${String(number).padStart(2, "0")}`,
    async fn() {
      const name = [event, action, number].filter(p => p != null).join('-')
      const p = `./tests/${name}.json`
      const stat = await Deno.stat(p)
      const file = await Deno.open(p)
      const res = await fetch("http://localhost:8000/webhook", {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
          "X-GitHub-Event": event.replace(/-/g, '_'),
          "Content-Length": `${stat.size}`,
        }),
        body: readableStreamFromReader(file),
      })
      await res.text();
      const { ok, status } = res
      assertObjectMatch(
        { ok, status },
        {
          ok: true,
          status: 200
        }
      )
    }
  })
}
