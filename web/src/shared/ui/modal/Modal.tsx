import { useTranslation } from "react-i18next";
import { type ReactNode, type MouseEvent } from "react";
import { X } from "lucide-react";
import { useDialogFocus } from "./use-dialog-focus";
interface IModal {
  title: string;
  heading?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}
export function Modal({ title, heading, onClose, children }: IModal) {
  const { t } = useTranslation();
  const focus = useDialogFocus(onClose);
  function onBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }
  return (
    <div className="overlay" onMouseDown={onBackdrop}>
      <div {...focus} tabIndex={-1} className="modal" role="dialog" aria-modal="true" aria-label={t(title)}>
        <div className="modal-heading">
          <h2>{heading ?? t(title)}</h2>
          <button className="icon-btn" aria-label={t("Закрыть")} onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
