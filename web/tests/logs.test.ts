import { filterLogs } from "@/utils/core/logs/log-text";
import { logEntries } from "@/utils/core/logs/log-clients";
import assert from "node:assert/strict";
import { test } from "node:test";
test("log search handles Unicode, severity and trailing empty lines", () => {
  const text = "INFO Сертификат обновлён\nERROR Ошибка ACME\nWARN Retry\nFATAL Failure\n";
  assert.deepEqual(filterLogs(text, "СЕРТИФИКАТ", ""), ["INFO Сертификат обновлён"]);
  assert.deepEqual(filterLogs(text, "", "error"), ["ERROR Ошибка ACME", "FATAL Failure"]);
  assert.deepEqual(filterLogs(text, "missing", ""), []);
});
test("client identities resolve users and device entries without rewriting raw logs", () => {
  const user = { id: "a".repeat(16), name: "🚀 Phone", enabled: true, expires: "", created: "" };
  const other = { ...user, id: "b".repeat(16), name: "Laptop" };
  const lines = [
    `INFO client connected {"id":"${user.id}"}`,
    `WARN TCP error {"id":"${user.id}.${"c".repeat(32)}.${"d".repeat(16)}"}`,
    `INFO client connected {"id":"${other.id}"}`,
    `INFO server up`,
    `WARN legacy {"id":"external-user"}`,
  ];
  const text = lines.join("\n");
  const entries = logEntries(text, [user, other], "", "", user.id);
  assert.deepEqual(
    entries.map((entry) => entry.text),
    lines.slice(0, 2),
  );
  assert.equal(entries[1].client?.name, user.name);
  assert.equal(entries[1].client?.deviceId, "c".repeat(32));
  assert.equal(logEntries(text, [user, other], "PHONE", "error", user.id).length, 0);
  assert.equal(logEntries(text, [user, other], "PHONE", "warn", user.id).length, 1);
  assert.equal(logEntries(text, [], "", "", "").length, lines.length);
  assert.equal(logEntries("INFO malformed {oops", [user], "", "", "")[0].client, undefined);
});
