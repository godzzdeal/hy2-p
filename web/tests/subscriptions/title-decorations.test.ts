import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseProfileTitle,
  formatProfileTitle,
  renameProfileTitle,
} from "@/features/admin/announcement/profile/title";
test("subscription flag and emoji can be edited independently", () => {
  const value = parseProfileTitle("🇳🇱 🚀 Нидерланды");
  assert.deepEqual(value, { flag: "🇳🇱", emoji: "🚀", name: "Нидерланды" });
  assert.equal(formatProfileTitle({ ...value, emoji: "🐱" }), "🇳🇱 🐱 Нидерланды");
  assert.equal(formatProfileTitle({ ...value, flag: "" }), "🚀 Нидерланды");
  assert.equal(formatProfileTitle({ ...value, emoji: "" }), "🇳🇱 Нидерланды");
  assert.equal(renameProfileTitle("🇳🇱 🚀 Нидерланды", "Сервер"), "🇳🇱 🚀 Сервер");
  assert.equal(renameProfileTitle("🇳🇱 Сервер", "👩🏽‍💻 Новый"), "🇳🇱 👩🏽‍💻 Новый");
});
