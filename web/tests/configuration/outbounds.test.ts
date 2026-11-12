import { editOutbounds } from "@/utils/configuration/structured/outbounds/model";
import assert from "node:assert/strict";
import { test } from "node:test";
import { parse } from "yaml";
import { aclOutboundNames, EMPTY_ACL_RULE, moveAclRule, NEW_ACL_RULE, parseAclRule, readAclLines, serializeAclRule, updateAclRule, validateAclAddress, validateAclPorts } from "@/utils/configuration/structured/acl";
test("outbounds can be added from an empty config and removed cleanly", () => {
  const added = editOutbounds("listen: :8443\n", { type: "add" });
  assert.equal(parse(added).outbounds[0].name, "outbound_1");
  assert.equal(parse(added).outbounds[0].type, "direct");
  const removed = editOutbounds(added, { type: "remove", index: 0 });
  assert.equal(parse(removed).outbounds, undefined);
});

test("ACL editor round-trips the documented address, protocol and hijack forms", () => {
  for (const source of [
    "direct(all)", "reject(192.0.2.0/24)", "direct(2001:db8::1, tcp/443)",
    "proxy(2001:db8::/32, udp/1000-2000)", "reject(*.example.com, udp/443)",
    "direct(suffix:example.com)", "direct(geoip:private)", "proxy(geosite:google@cn)",
    "direct(all, */53, 1.1.1.1)", "direct(all, udp/53, 2001:db8::1)",
  ]) {
    const rule = parseAclRule(source);
    assert.equal(rule.mode, "rule", source);
    assert.equal(serializeAclRule(rule), source);
  }
  assert.equal(parseAclRule("# keep this comment").mode, "comment");
});

test("ACL unknown or malformed syntax remains editable as original text", () => {
  for (const source of ["", "future(all, custom)", "direct(all, tcp/80/443)", "direct(999.1.1.1)", "direct(all, udp/53, example.com)", "direct(all, tcp/0)"]) {
    const rule = parseAclRule(source);
    assert.equal(rule.mode, "text");
    assert.equal(serializeAclRule(rule), source);
  }
  assert.deepEqual(readAclLines(["direct(all)", "# comment"]), ["direct(all)", "# comment"]);
  assert.equal(readAclLines(["direct(all)", { invalid: true }]), null);
  assert.equal(readAclLines("direct(all)"), null);
});

test("ACL rule order, bulk insertion and invalid edit indices preserve other rules", () => {
  const lines = ["reject(all, udp/443)", "direct(all)"];
  assert.deepEqual(moveAclRule(lines, 1, -1), [lines[1], lines[0]]);
  assert.equal(moveAclRule(lines, -1, 1), lines);
  assert.equal(moveAclRule(lines, 0, -1), lines);
  assert.equal(moveAclRule(lines, 0, 2), lines);
  assert.equal(updateAclRule(lines, 9, "reject(all)"), lines);
  assert.equal(updateAclRule(lines, -2, "reject(all)"), lines);
  assert.deepEqual(updateAclRule(lines, NEW_ACL_RULE, "# extra\nproxy(all)"), [...lines, "# extra", "proxy(all)"]);
  assert.deepEqual(updateAclRule(lines, 0, "proxy(all)"), ["proxy(all)", lines[1]]);
  assert.deepEqual(lines, ["reject(all, udp/443)", "direct(all)"]);
});

test("ACL validates IP families, masks and port bounds without changing unknown YAML", () => {
  for (const address of ["192.0.2.1", "2001:db8::1", "::1"]) assert.equal(validateAclAddress("ip", address), true);
  for (const address of ["256.0.0.1", "1.2.3", "::g", "192.0.2.1:80"]) assert.equal(validateAclAddress("ip", address), false);
  assert.equal(validateAclAddress("cidr", "2001:db8::/128"), true);
  assert.equal(validateAclAddress("cidr", "192.0.2.0/33"), false);
  assert.equal(validateAclAddress("domain", "*.example.com"), true);
  for (const port of ["*", "1", "65535", "80-443"]) assert.equal(validateAclPorts(port), true);
  for (const port of ["0", "65536", "443-80", "1-2-3", "abc"]) assert.equal(validateAclPorts(port), false);
  assert.deepEqual(aclOutboundNames([{name:"proxy"}, {name:"direct"}, {unknown:true}]), ["direct", "reject", "default", "proxy"]);
  assert.equal(serializeAclRule({...EMPTY_ACL_RULE, mode:"comment", text:"one\ntwo"}), "# one\n# two");
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
