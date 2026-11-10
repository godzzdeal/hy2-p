const MAX_PEM_BYTES = 1024 * 1024;

export async function readPemFile(file: File): Promise<string> {
  if (file.size > MAX_PEM_BYTES) throw new Error("Файл сертификата слишком большой");
  return file.text();
}
