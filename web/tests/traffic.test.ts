import assert from "node:assert/strict";
import test from "node:test";
import { BYTE_UNITS, formatBytes, formatUsage } from "@/services/users/traffic/byte-format";

test("usage and quota share a unit and follow the selected language", () => {
  assert.equal(formatUsage(1.13 * BYTE_UNITS.gigabyte, 20 * BYTE_UNITS.gigabyte, undefined, "ru"), "1,13/20 ГБ");
  assert.equal(formatUsage(1.13 * BYTE_UNITS.gigabyte, 20 * BYTE_UNITS.gigabyte, (unit) => unit === "ГБ" ? "GB" : unit, "en"), "1.13/20 GB");
});

test("quota formatting handles different scales and exceeded limits", () => {
  assert.equal(formatUsage(512 * BYTE_UNITS.megabyte, BYTE_UNITS.gigabyte, undefined, "en"), "0.5/1 ГБ");
  assert.equal(formatUsage(25 * BYTE_UNITS.gigabyte, 20 * BYTE_UNITS.gigabyte, undefined, "ru"), "25/20 ГБ");
  assert.equal(formatUsage(0, 20 * BYTE_UNITS.gigabyte, undefined, "ru"), "0/20 ГБ");
});

test("unlimited usage keeps its size without an invented quota", () => {
  assert.equal(formatUsage(BYTE_UNITS.megabyte, 0, undefined, "ru"), "1 МБ/∞");
  assert.equal(formatBytes(0, undefined, "en"), "0 Б");
  assert.equal(formatBytes(BYTE_UNITS.terabyte, undefined, "en"), "1 ТБ");
});
