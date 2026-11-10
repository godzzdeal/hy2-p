export function selectUploadFile(files: FileList, accept: string): File | undefined {
  if (!files.length) return;
  if (files.length !== 1) throw new Error("Выберите один файл");
  const file = files[0];
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  const isAccepted = accept.split(",").some((entry) => {
    const format = entry.trim().toLowerCase();
    if (format.startsWith(".")) return name.endsWith(format);
    if (format.endsWith("/*")) return type.startsWith(format.slice(0, -1));
    return type === format;
  });
  if (!isAccepted) throw new Error("Неподдерживаемый формат файла");
  return file;
}
