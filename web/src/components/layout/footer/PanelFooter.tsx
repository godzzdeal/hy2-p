import { Earth, Github } from "@/components/elements/icons";
import { ButtonLink } from "@/components/ui/button/ButtonLink";
import { ReleaseStatus } from "@/components/layout/footer/ReleaseStatus";
import { BuildVersion } from "@/components/layout/sidebar/BuildVersion";
import { InstallButton } from "@/components/elements/install/InstallButton";
import { InstallHelp } from "@/components/elements/install/InstallHelp";
import { useState } from "react";
export function PanelFooter() {
  const [isHelpOpen, setHelpOpen] = useState(false);
  return (
    <>
      <footer
        className="panel-footer shrink-0 z-10 grid grid-cols-toolbar items-center gap-4 p-3 border-0 border-t-2 border-line bg-surface text-muted text-lg shadow-none max-desktop:grid-cols-action max-tablet:flex max-tablet:justify-between max-tablet:gap-2 max-tablet:px-3 max-tablet:py-2"
        role="contentinfo"
      >
        <div className="footer-identity flex items-center gap-3 min-w-0 max-tablet:gap-2">
          <span className="footer-mark grid place-items-center w-8 h-8 shrink-0 bg-surface-soft text-accent max-tablet:hidden">
            <Earth width={24} height={24} aria-hidden />
          </span>
          <div>
            <div className="footer-name flex items-baseline flex-wrap gap-2">
              <strong className="max-tablet:text-lg">HY2-P</strong>
              <BuildVersion className="max-tablet:text-sm" />
            </div>
          </div>
        </div>
        <ReleaseStatus />
        <div className="footer-actions flex items-center gap-2 max-desktop:col-start-2 max-desktop:row-start-1 max-tablet:ml-auto">
          <InstallButton isCompact onHelp={() => setHelpOpen(true)} />
          <ButtonLink
            className="footer-github inline-flex items-center justify-center gap-2 min-h-control px-3 max-tablet:px-2"
            href="https://github.com/godzzdeal/hy2-p"
            target="_blank"
            rel="noreferrer"
          >
            <Github width={24} height={24} aria-hidden />
            GitHub
          </ButtonLink>
        </div>
      </footer>
      {isHelpOpen && <InstallHelp onClose={() => setHelpOpen(false)} />}
    </>
  );
}
