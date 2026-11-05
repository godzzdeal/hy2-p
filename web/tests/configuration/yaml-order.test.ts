import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import { orderConfiguration } from "../../src/features/configuration/structured/model/yaml/ordering";
import { updateField } from "../../src/features/configuration/structured/model/yaml/fields";
test("documented order is stable regardless of edit order", () => {
  const first = updateField(updateField("listen: :443", "auth.type", "password"), "obfs.type", "gecko");
  const second = updateField(updateField("listen: :443", "obfs.type", "gecko"), "auth.type", "password");
  assert.equal(first, second);
  assert.ok(first.indexOf("listen:") < first.indexOf("obfs:"));
  assert.ok(first.indexOf("obfs:") < first.indexOf("auth:"));
});
test("comments, unknown settings and routing sequence order survive", () => {
  const source =
    "# header\nauth: { type: password, password: test }\n# listen comment\nlisten: :443\ncustomZ: 1\ncustomA: 2\noutbounds:\n  - { name: second, type: direct }\n  - { name: first, type: direct }\n";
  const result = orderConfiguration(source);
  assert.deepEqual(parse(result), parse(source));
  assert.match(result, /# header/);
  assert.match(result, /# listen comment/);
  assert.ok(result.indexOf("customZ:") < result.indexOf("customA:"));
  assert.equal(orderConfiguration(result), result);
});
test("anchor declarations stay before dependent aliases", () => {
  const source = "custom: &shared { cert: example.crt, key: example.key }\ntls: *shared\nlisten: :443\n";
  const result = orderConfiguration(source);
  assert.ok(result.indexOf("&shared") < result.indexOf("*shared"));
  assert.deepEqual(parse(result), parse(source));
});
test("QUIC settings follow documentation within their section", () => {
  const result = orderConfiguration(
    "quic:\n  maxIncomingStreams: 10\n  maxIdleTimeout: 30s\n  initStreamReceiveWindow: 1024\n",
  );
  assert.ok(result.indexOf("initStreamReceiveWindow:") < result.indexOf("maxIdleTimeout:"));
  assert.ok(result.indexOf("maxIdleTimeout:") < result.indexOf("maxIncomingStreams:"));
});
