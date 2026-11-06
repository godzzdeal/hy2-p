import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import { editOutbounds } from "@/features/configuration/structured/outbounds/model";
test("outbounds can be added from an empty config and removed cleanly", () => {
  const added = editOutbounds("listen: :8443\n", { type: "add" });
  assert.equal(parse(added).outbounds[0].name, "outbound_1");
  assert.equal(parse(added).outbounds[0].type, "direct");
  const removed = editOutbounds(added, { type: "remove", index: 0 });
  assert.equal(parse(removed).outbounds, undefined);
});
test("changing an outbound mode clears its credentials and keeps other data", () => {
  const source =
    "listen: :8443\noutbounds:\n  - name: first # keep name comment\n    type: socks5\n    socks5:\n      addr: 127.0.0.1:1080\n      password: old-secret\n    custom: keep\n  - name: second\n    type: direct\n";
  const changed = editOutbounds(source, { type: "set", index: 0, path: "type", value: "http" });
  assert.ok(!changed.includes("old-secret"));
  assert.ok(changed.includes("# keep name comment"));
  assert.equal(parse(changed).outbounds[0].custom, "keep");
  assert.equal(parse(changed).outbounds[1].name, "second");
});
test("an explicit outbound false remains distinct from resetting to default", () => {
  let source = editOutbounds("listen: :8443\n", { type: "add" });
  source = editOutbounds(source, { type: "set", index: 0, path: "direct.fastOpen", value: false });
  assert.equal(parse(source).outbounds[0].direct.fastOpen, false);
  source = editOutbounds(source, { type: "set", index: 0, path: "direct.fastOpen", value: undefined });
  assert.equal(parse(source).outbounds[0].direct, undefined);
});
