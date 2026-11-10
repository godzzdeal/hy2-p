import { X } from "@/components/elements/icons";
import { useDialogFocus } from "@/hooks/ui/use-dialog-focus";
import { cn } from "@/utils/cn";
import { type MouseEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
interface IModal {
  className?: string;
  title: string;
  heading?: ReactNode;
  onClose: () => void;
  isDismissible?: boolean;
  children: ReactNode;
}
export function Modal({ title, heading, onClose, children, className, isDismissible = true }: IModal) {
  const { t } = useTranslation();
  function onDismiss() {
    if (isDismissible) onClose();
  }
  const focus = useDialogFocus(onDismiss);
  function onBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onDismiss();
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
          <button
            className="icon-btn"
            aria-label={t("Закрыть")}
            onClick={onDismiss}
            disabled={!isDismissible}
          >
            <X width={24} height={24} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
