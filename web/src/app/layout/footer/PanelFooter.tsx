import { Earth, Github } from "@/shared/icons";
import { BuildVersion } from "@/app/layout/sidebar/BuildVersion";
import { ReleaseStatus } from "./ReleaseStatus";
export function PanelFooter() {
  return (
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
      <a
        className="footer-github secondary"
        href="https://github.com/godzzdeal/hy2-p"
        target="_blank"
        rel="noreferrer"
      >
        <Github width={24} height={24} aria-hidden />
        GitHub
      </a>
    </footer>
  );
}
