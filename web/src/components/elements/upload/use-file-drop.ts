import { selectUploadFile } from "@/components/elements/upload/validation";
import { useUiStore } from "@/store/ui-store";
import { useRef, useState, type ComponentProps, type DragEvent } from "react";

export interface IFileDropOptions
  extends Required<Pick<ComponentProps<"input">, "accept">>, Pick<ComponentProps<"input">, "disabled"> {
  isBusy?: boolean;
  onFile: (file: File) => void | Promise<void>;
}

export function useFileDrop({ accept, disabled, isBusy, onFile }: IFileDropOptions) {
  const [filename, setFilename] = useState("");
  const [isDragging, setDragging] = useState(false);
  const [isReading, setReading] = useState(false);
  const dragDepth = useRef(0);
  const isReadingRef = useRef(false);
  const showError = useUiStore((state) => state.showError);
  const isUnavailable = !!disabled || !!isBusy || isReading;

  async function onFiles(files: FileList) {
    if (isUnavailable || isReadingRef.current) return;
    try {
      const file = selectUploadFile(files, accept);
      if (!file) return;
      setFilename(file.name);
      isReadingRef.current = true;
      setReading(true);
      await onFile(file);
    } catch (error) {
      showError(error);
    } finally {
      isReadingRef.current = false;
      setReading(false);
    }
  }
  function onDragEnter(event: DragEvent<HTMLButtonElement>) {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    dragDepth.current += 1;
    if (!isUnavailable) setDragging(true);
  }
  function onDragLeave() {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (!dragDepth.current) setDragging(false);
  }
  function onDragOver(event: DragEvent<HTMLButtonElement>) {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = isUnavailable ? "none" : "copy";
  }
  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setDragging(false);
    void onFiles(event.dataTransfer.files);
  }
  return {
    filename,
    isDragging: isDragging && !isUnavailable,
    isReading: isReading || !!isBusy,
    isUnavailable,
    onFiles,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
  };
}
