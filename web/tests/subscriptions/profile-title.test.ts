import { test } from "node:test";
import assert from "node:assert/strict";
import { replaceFlag, FLAGS } from "@/features/admin/announcement/profile/flag-options";
test("changing a flag preserves the subscription name", () => {
  assert.equal(replaceFlag("Германия", "🇩🇪"), "🇩🇪 Германия");
  assert.equal(replaceFlag("🇩🇪 Германия", "🇫🇮"), "🇫🇮 Германия");
  assert.equal(replaceFlag("🇫🇮 Германия", ""), "Германия");
});
test("country presets contain valid flag pairs without duplicates", () => {
  assert.equal(new Set(FLAGS.map((option) => option.flag)).size, FLAGS.length);
  assert.equal(FLAGS.find((option) => option.region === "DE")?.flag, "🇩🇪");
});

import { regionFromFlag } from "@/shared/flags/flag-options";
test("flag assets use region codes without relying on emoji fonts", () => {
  assert.equal(regionFromFlag("🇩🇪"), "DE");
  assert.equal(regionFromFlag("🇺🇸"), "US");
  assert.equal(regionFromFlag("invalid"), "");
});
