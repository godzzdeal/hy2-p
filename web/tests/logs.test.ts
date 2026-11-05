import { test } from "node:test";
import assert from "node:assert/strict";
import { filterLogs } from "../src/features/core/logs/model/log-text";
test("log search handles Unicode, severity and trailing empty lines", () => {
  const text = "INFO Сертификат обновлён\nERROR Ошибка ACME\nWARN Retry\nFATAL Failure\n";
  assert.deepEqual(filterLogs(text, "СЕРТИФИКАТ", ""), ["INFO Сертификат обновлён"]);
  assert.deepEqual(filterLogs(text, "", "error"), ["ERROR Ошибка ACME", "FATAL Failure"]);
  assert.deepEqual(filterLogs(text, "missing", ""), []);
});
