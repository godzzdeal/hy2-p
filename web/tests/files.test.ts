import assert from "node:assert/strict";
import { test } from "node:test";
import { downloadFilename } from "@/utils/files/filename";
import { fileFingerprint } from "@/utils/files/fingerprint";

test("download names include server, UTC timestamp, exact content fingerprint and original filename", async () => {
  const filename = await downloadFilename({
    server: "vpn.example.com",
    name: "hy2-p.json",
    blob: new Blob(["abc"]),
    createdAt: new Date("2026-11-11T04:05:06.789+03:00"),
  });
  assert.equal(filename, "vpn.example.com_20261111T010506.789Z_ba7816bf8f01_hy2-p.json");
});

test("filenames cannot contain paths or control characters", async () => {
  const filename = await downloadFilename({
    server: "../../bad\r\nhost",
    name: "C:\\private\\hysteria2.log",
    blob: new Blob(["abc"]),
    createdAt: new Date("2026-11-11T01:05:06Z"),
  });
  assert.doesNotMatch(filename, /[\\/\r\n]/);
  assert.ok(filename.endsWith("_hysteria2.log"));
  assert.notEqual(await fileFingerprint(new Blob(["abcd"])), "ba7816bf8f01");
});
