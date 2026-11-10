import { Earth, Github } from "@/components/elements/icons";
import { ReleaseStatus } from "@/components/layout/footer/ReleaseStatus";
import { BuildVersion } from "@/components/layout/sidebar/BuildVersion";
import { InstallButton } from "@/components/elements/install/InstallButton";
import { InstallHelp } from "@/components/elements/install/InstallHelp";
import { useState } from "react";
export function PanelFooter() {
  const [isHelpOpen, setHelpOpen] = useState(false);
  return (
    <>
      <footer className="panel-footer" role="contentinfo">
        <div className="footer-identity">
          <span className="footer-mark">
            <Earth width={24} height={24} aria-hidden />
          </span>
          <div>
            <div className="footer-name">
              <strong>HY2-P</strong>
              <BuildVersion />
            </div>
            <small>
              by{" "}
              <a href="https://github.com/godzzdeal" target="_blank" rel="noreferrer">
                godzzdeal
              </a>
            </small>
          </div>
        </div>
        <ReleaseStatus />
        <div className="footer-actions">
          <InstallButton isCompact onHelp={() => setHelpOpen(true)} />
          <a
            className="footer-github secondary"
            href="https://github.com/godzzdeal/hy2-p"
            target="_blank"
            rel="noreferrer"
          >
            <Github width={24} height={24} aria-hidden />
            GitHub
          </a>
        </div>
      </footer>
      {isHelpOpen && <InstallHelp onClose={() => setHelpOpen(false)} />}
    </>
  );
}
