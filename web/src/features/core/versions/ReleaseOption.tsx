import { useTranslation } from "react-i18next";
import type { IReleaseVersion } from "@/features/core/model/updates";
export function ReleaseOption({ release, current }: { release: IReleaseVersion; current: string }) {
  const { t, i18n } = useTranslation();
  const published = new Date(release.published).toLocaleDateString(i18n.language);
  return (
    <option value={release.tag} disabled={!release.available}>
      {release.tag.replace("app/", "")} · {published}
      {release.tag === current ? t(" \u00B7 установлена") : ""}
      {!release.available ? t(" \u00B7 недоступна для платформы") : ""}
    </option>
  );
}
