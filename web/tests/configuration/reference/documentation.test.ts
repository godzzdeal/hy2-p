import { DOCUMENTATION_SECTIONS } from "@/config/hysteria/structured/schema/documentation/sections";
import assert from "node:assert/strict";
import { test } from "node:test";
import reference from "./server-fields.json";
test("forms cover every property from the official configuration examples", () => {
  assert.ok(reference.fields.includes("disableUDP"));
  assert.ok(reference.fields.includes("outbounds[].direct.fastOpen"));
  const visible = new Set(
    DOCUMENTATION_SECTIONS.flatMap((section) => section.fields.map((field) => field.path)),
  );
  assert.deepEqual(
    reference.fields.filter((path) => !visible.has(path)),
    [],
  );
});
