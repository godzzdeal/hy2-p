import { SelectOption } from "@/components/ui/select/SelectOption";
import { type IReleaseVersion } from "@/services/core/updates/update-types";
import { useTranslation } from "react-i18next";
import { normalizeVersion } from "@/utils/core/version";
export function ReleaseOption({ release, current }: { release: IReleaseVersion; current: string }) {
  const { t, i18n } = useTranslation();
  const published = new Date(release.published).toLocaleDateString(i18n.language);
  return (
    <SelectOption value={release.tag} disabled={!release.available}>
      {normalizeVersion(release.tag)} ({published})
      {normalizeVersion(release.tag) === normalizeVersion(current) ? t(" (установлена)") : ""}
      {!release.available ? t(" (недоступна)") : ""}
    </SelectOption>
  );
}
