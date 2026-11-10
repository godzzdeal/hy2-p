import { fileFingerprint } from "@/utils/files/fingerprint";

const MAX_NAME_PART = 64;

interface IFileName {
  server: string;
  name: string;
  blob: Blob;
  createdAt?: Date;
}

function safeName(value: string, fallback: string): string {
  return (
    Array.from(value.replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/^[.-]+|[.-]+$/g, ""))
      .slice(0, MAX_NAME_PART)
      .join("") || fallback
  );
}

export async function downloadFilename({
  server,
  name,
  blob,
  createdAt = new Date(),
}: IFileName): Promise<string> {
  const original = name.replaceAll("\\", "/").split("/").at(-1) ?? "file";
  const time = createdAt.toISOString().replace(/[-:]/g, "");
  const fingerprint = await fileFingerprint(blob);
  return `${safeName(server, "server")}_${time}_${fingerprint}_${safeName(original, "file")}`;
}
