import { type Locator } from "@playwright/test";

interface IDroppedFile {
  name: string;
  type: string;
  text: string;
}

export async function dropFiles(
  zone: Locator,
  files: IDroppedFile[],
  onHover?: () => Promise<void>,
): Promise<void> {
  const transfer = await zone.evaluateHandle((_, payload) => {
    const data = new DataTransfer();
    for (const file of payload) data.items.add(new File([file.text], file.name, { type: file.type }));
    return data;
  }, files);
  try {
    await zone.dispatchEvent("dragenter", { dataTransfer: transfer });
    await zone.dispatchEvent("dragover", { dataTransfer: transfer });
    await onHover?.();
    await zone.dispatchEvent("drop", { dataTransfer: transfer });
  } finally {
    await transfer.dispose();
  }
}
