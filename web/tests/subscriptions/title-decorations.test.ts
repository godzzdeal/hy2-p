import { leadingEmoji, replaceEmoji } from "@/utils/emoji/model";
import assert from "node:assert/strict";
import { test } from "node:test";
test("subscription name uses the shared emoji helpers", () => {
  assert.equal(leadingEmoji("🚀 Сервер"), "🚀");
  assert.equal(replaceEmoji("🚀 Сервер", "🐱"), "🐱 Сервер");
  assert.equal(replaceEmoji("🚀 Сервер", ""), "Сервер");
});
