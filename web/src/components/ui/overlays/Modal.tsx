import { Button } from "@/components/ui/button/Button";
import { X } from "@/components/elements/icons";
import { useDialogFocus } from "@/hooks/ui/use-dialog-focus";
import { cn } from "@/utils/cn";
import { type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { DIALOG_STYLES } from "@/components/ui/overlays/overlay-styles";
import { useTranslation } from "react-i18next";
interface IModal extends Omit<ComponentProps<"div">, "title" | "onClose"> {
  title: string;
  heading?: ReactNode;
  onClose: () => void;
  isDismissible?: boolean;
  children: ReactNode;
}
export function Modal({
  title,
  heading,
  onClose,
  children,
  className,
  isDismissible = true,
  ...props
}: IModal) {
  const { t } = useTranslation();
  function onDismiss() {
    if (isDismissible) onClose();
  }
  const focus = useDialogFocus(onDismiss);
  function onBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onDismiss();
  }
  return (
    <div
      className="overlay max-tablet:p-4 fixed inset-0 z-20 flex items-center justify-center bg-backdrop p-4 backdrop-blur-sm"
      onMouseDown={onBackdrop}
    >
      <div
        {...props}
        {...focus}
        tabIndex={-1}
        className={cn("modal", DIALOG_STYLES, className)}
        role="dialog"
        aria-modal="true"
        aria-label={t(title)}
      >
        <div className="modal-heading mb-4 flex shrink-0 items-center justify-between gap-3">
          <h2 className="min-w-0 text-balance wrap-anywhere">{heading ?? t(title)}</h2>
          <Button size="icon" aria-label={t("Закрыть")} onClick={onDismiss} disabled={!isDismissible}>
            <X width={24} height={24} aria-hidden />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
