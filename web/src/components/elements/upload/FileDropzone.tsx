import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/fields/controls/Input";
import { useFileDrop, type IFileDropOptions } from "@/components/elements/upload/use-file-drop";
import { cn } from "@/utils/cn";
import { Upload } from "pixelarticons/react/Upload.js";
import { Spinner } from "@/components/ui/loading";
import { useId, useRef } from "react";
import { useTranslation } from "react-i18next";

interface IFileDropzone extends IFileDropOptions {
  label: string;
  hint: string;
}

export function FileDropzone({ label, hint, ...options }: IFileDropzone) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const drop = useFileDrop(options);
  const Icon = drop.isReading ? Spinner : Upload;
  return (
    <div className="file-upload grid gap-2 min-w-0">
      <span className="file-upload-label">{label}</span>
      <Button
        type="button"
        className={cn(
          "file-dropzone w-full min-w-0 min-h-26 h-auto p-4 gap-4 border-line border-dashed bg-input text-left",
          { "file-dropzone-active": drop.isDragging },
        )}
        aria-label={t("Выбрать файл: {{label}}", { label })}
        aria-describedby={hintId}
        aria-busy={drop.isReading}
        disabled={drop.isUnavailable}
        onClick={() => input.current?.click()}
        onDragEnter={drop.onDragEnter}
        onDragLeave={drop.onDragLeave}
        onDragOver={drop.onDragOver}
        onDrop={drop.onDrop}
      >
        <Icon width={32} height={32} aria-hidden="true" />
        <span className="file-dropzone-content grid gap-1 min-w-0 wrap-anywhere">
          <strong>
            {t(
              drop.isReading
                ? "Обрабатываем файл…"
                : drop.isDragging
                  ? "Отпустите файл для загрузки"
                  : "Перетащите файл сюда",
            )}
          </strong>
          <span className="file-dropzone-name" role="status">
            {drop.filename || t("или нажмите, чтобы выбрать")}
          </span>
          <small id={hintId}>{hint}</small>
        </span>
      </Button>
      <Input
        ref={input}
        hidden
        type="file"
        aria-label={label}
        accept={options.accept}
        disabled={drop.isUnavailable}
        onChange={(event) => {
          if (event.target.files) void drop.onFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
