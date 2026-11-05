import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import {
  updateField,
  parseField,
  certificateMode,
} from "../../src/features/configuration/structured/model/yaml/fields";
test("reset removes empty parents and leaves unrelated settings and comments", () => {
  const result = updateField(
    "# keep\nlisten: :8443\nquic:\n  maxIncomingStreams: 32\n",
    "quic.maxIncomingStreams",
    undefined,
  );
  assert.deepEqual(parse(result), { listen: ":8443" });
  assert.match(result, /# keep/);
});
test("resetting mode removes its branch and changing mode drops old secrets", () => {
  const source = "obfs:\n  type: salamander\n  salamander:\n    password: old-secret\nlisten: :443\n";
  assert.deepEqual(parse(updateField(source, "obfs.type", "")), { listen: ":443" });
  const changed = parse(updateField(source, "obfs.type", "gecko"));
  assert.deepEqual(changed.obfs, { type: "gecko" });
  assert.doesNotMatch(updateField(source, "obfs.type", "gecko"), /old-secret/);
});
test("ACME challenge reset keeps domain and email but clears inactive challenges", () => {
  const source =
    "acme:\n  domains: [example.org]\n  email: test@example.org\n  type: dns\n  dns:\n    name: cloudflare\n    config: {token: secret}\n";
  const changed = parse(updateField(source, "acme.type", undefined));
  assert.deepEqual(changed.acme, { domains: ["example.org"], email: "test@example.org" });
});
test("DNS provider switch removes previous credentials", () => {
  const source = "acme:\n  dns:\n    name: cloudflare\n    config: {token: secret}\n";
  assert.deepEqual(parse(updateField(source, "acme.dns.name", "duckdns")).acme.dns, { name: "duckdns" });
});
test("explicit false remains distinct from default and empty lists clear the field", () => {
  assert.equal(parse(updateField("", "sniff.rewriteDomain", false)).sniff.rewriteDomain, false);
  assert.equal(parseField("  \n ", "lines"), undefined);
  assert.deepEqual(parse(updateField("acl:\n  inline: [test]\n", "acl.inline", parseField("", "lines"))), {});
});
test("switching away from BBR removes its profile", () => {
  const result = updateField(
    "congestion:\n  type: bbr\n  bbrProfile: aggressive\n",
    "congestion.type",
    "reno",
  );
  assert.deepEqual(parse(result), { congestion: { type: "reno" } });
});
test("new HTTP certificate mode does not include unrelated DNS credentials", () => {
  const result = parse(certificateMode("tls: { cert: x, key: y }", "acme"));
  assert.equal(result.tls, undefined);
  assert.equal(result.acme.type, "http");
  assert.equal(result.acme.dns, undefined);
});
test("invalid raw YAML never gets silently replaced", () => {
  assert.throws(() => updateField("tls: [", "listen", ":443"));
});
