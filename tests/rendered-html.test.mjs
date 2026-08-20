import assert from "node:assert/strict";
import test from "node:test";

test("renders the GearProof product shell and metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<title>GearProof — test your gear and prove the result<\/title>/i);
  assert.match(html, /Test your gear\./i);
  assert.match(html, /Test here/i);
  assert.match(html, /og\.png/i);
  assert.match(html, /Free · runs locally/i);
  assert.doesNotMatch(html, /Pricing|Create account|15 PLN|Unlock seller PDF/i);
});
