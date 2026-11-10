import { downloadFilename } from "@/utils/files/filename";

const DOWNLOAD_URL_LIFETIME_MS = 1000;

export async function downloadFile(
  blob: Blob,
  name: string,
  server = window.location.hostname,
): Promise<void> {
  const filename = await downloadFilename({ blob, name, server });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFETIME_MS);
  }
}
