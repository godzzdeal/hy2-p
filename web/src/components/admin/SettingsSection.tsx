import { styleClass } from "@/styles/runtime";
import { Card } from "@/components/ui/cards/Card";
import { CardHeader } from "@/components/ui/cards/CardHeader";
import { Button } from "@/components/ui/button/Button";
import { ChevronRight } from "pixelarticons/react/ChevronRight.js";
import { useSettingsSection } from "@/hooks/layout/use-settings-section";
import { cn } from "@/utils/cn";
import { Activity, type ReactNode } from "react";

interface ISettingsSection {
  id: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SettingsSection({ id, title, action, children }: ISettingsSection) {
  const { isOpen, hasOpened, onToggle } = useSettingsSection(id);
  return (
    <Card className="settings-section" id={id} data-scroll-section data-scroll-label={title}>
      <CardHeader>
        <h2>
          <Button
            type="button"
            className="settings-toggle flex items-center justify-start gap-3 min-h-12 h-auto py-2 px-0 w-full border-0 bg-transparent shadow-none text-start"
            aria-expanded={isOpen}
            aria-controls={id + "-content"}
            onClick={onToggle}
          >
            <ChevronRight
              className={styleClass(cn("settings-chevron w-6 h-6 shrink-0", isOpen && "is-expanded"))}
              aria-hidden="true"
            />
            <span>{title}</span>
          </Button>
        </h2>
        {action}
      </CardHeader>
      <div id={id + "-content"} hidden={!isOpen}>
        {hasOpened && <Activity mode={isOpen ? "visible" : "hidden"}>{children}</Activity>}
      </div>
    </Card>
  );
}
