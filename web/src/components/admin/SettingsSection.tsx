import { ChevronRight } from "pixelarticons/react/ChevronRight.js";
import { useSettingsSection } from "@/hooks/layout/use-settings-section";
import { cn } from "@/utils/cn";
import { type ReactNode } from "react";

interface ISettingsSection {
  id: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SettingsSection({ id, title, action, children }: ISettingsSection) {
  const { isOpen, onToggle } = useSettingsSection(id);
  return (
    <section className="card settings-section" id={id} data-scroll-section data-scroll-label={title}>
      <div className="card-header">
        <h2>
          <button
            type="button"
            className="settings-toggle"
            aria-expanded={isOpen}
            aria-controls={id + "-content"}
            onClick={onToggle}
          >
            <ChevronRight className={cn("settings-chevron", isOpen && "is-expanded")} aria-hidden="true" />
            <span>{title}</span>
          </button>
        </h2>
        {action}
      </div>
      <div id={id + "-content"} hidden={!isOpen}>
        {children}
      </div>
    </section>
  );
}
