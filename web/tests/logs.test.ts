import { filterLogs } from "@/utils/core/logs/log-text";
import assert from "node:assert/strict";
import { test } from "node:test";
test("log search handles Unicode, severity and trailing empty lines", () => {
  const text = "INFO Сертификат обновлён\nERROR Ошибка ACME\nWARN Retry\nFATAL Failure\n";
  assert.deepEqual(filterLogs(text, "СЕРТИФИКАТ", ""), ["INFO Сертификат обновлён"]);
  assert.deepEqual(filterLogs(text, "", "error"), ["ERROR Ошибка ACME", "FATAL Failure"]);
  assert.deepEqual(filterLogs(text, "missing", ""), []);
});
