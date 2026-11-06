import { test } from "node:test";
import assert from "node:assert/strict";
import { leadingEmoji, replaceEmoji, stripEmoji, emojiAsset } from "@/shared/emoji/model";
import { emojiParts } from "@/shared/emoji/text/parts";
import { existsSync } from "node:fs";
test("user emoji changes preserve the name and complete Unicode sequences", () => {
  assert.equal(replaceEmoji("🇩🇪 Телефон", "🚀"), "🚀 Телефон");
  assert.equal(replaceEmoji("🚀 Телефон", "👩🏽‍💻"), "👩🏽‍💻 Телефон");
  assert.equal(leadingEmoji("👩🏽‍💻 Телефон"), "👩🏽‍💻");
  assert.equal(stripEmoji("👩🏽‍💻 Телефон"), "Телефон");
  assert.equal(replaceEmoji("👩🏽‍💻 Телефон", ""), "Телефон");
  assert.equal(leadingEmoji("Телефон 🚀"), "");
});
test("local SVG assets support variation selectors, flags, skin tones and ZWJ", () => {
  for (const emoji of ["🚀", "🐱", "💎", "❤️", "1️⃣", "🇩🇪", "👩🏽‍💻", "👨‍👩‍👧‍👦"]) {
    assert.equal(existsSync("node_modules/@twemoji/svg/" + emojiAsset(emoji).split("/").at(-1)), true);
  }
  assert.equal(emojiAsset("❤️"), "/emoji/2764.svg");
  assert.deepEqual(
    emojiParts("Имя 🚀 и 👩🏽‍💻")
      .filter((part) => part.isEmoji)
      .map((part) => part.text),
    ["🚀", "👩🏽‍💻"],
  );
});
