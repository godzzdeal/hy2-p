import { useTranslation } from "react-i18next";
import { type ReactNode, type MouseEvent } from "react";
import { X } from "@/shared/icons";
import { useDialogFocus } from "./use-dialog-focus";
import { cn } from "@/shared/lib";
interface IModal {
  className?: string;
  title: string;
  heading?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}
export function Modal({ title, heading, onClose, children, className }: IModal) {
  const { t } = useTranslation();
  const focus = useDialogFocus(onClose);
  function onBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }
  return (
    <div className="overlay" onMouseDown={onBackdrop}>
      <div
        {...focus}
        tabIndex={-1}
        className={cn("modal", className)}
        role="dialog"
        aria-modal="true"
        aria-label={t(title)}
      >
        <div className="modal-heading">
          <h2>{heading ?? t(title)}</h2>
          <button className="icon-btn" aria-label={t("Закрыть")} onClick={onClose}>
            <X width={24} height={24} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
