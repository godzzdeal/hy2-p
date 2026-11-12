import { Caption } from "@/components/elements/Caption";
import { HysteriaBadge } from "@/components/elements/hysteria";
import { Card } from "@/components/ui/cards/Card";
import { CardHeader } from "@/components/ui/cards/CardHeader";
import { Button } from "@/components/ui/button/Button";
import { Field } from "@/components/ui/fields/Field";
import { UpdateConfirmation } from "@/components/core/UpdateConfirmation";
import { ReleaseOption } from "@/components/core/versions/ReleaseOption";
import { UpdateProgress } from "@/components/core/versions/UpdateProgress";
import { Download, RefreshCw, Undo2 } from "@/components/elements/icons";
import { Select } from "@/components/ui/select/Select";
import { SelectOption } from "@/components/ui/select/SelectOption";
import { useReleaseVersions, useUpdateStatus } from "@/hooks/core/updates/use-updates";
import { normalizeVersion } from "@/utils/core/version";
import { useState } from "react";
import { useTranslation } from "react-i18next";
export function UpdateCard() {
  const { t } = useTranslation();
  const versions = useReleaseVersions();
  const status = useUpdateStatus();
  const [selected, setSelected] = useState("");
  const [confirmation, setConfirmation] = useState<"install" | "rollback" | null>(null);
  const latest = versions.data?.find((release) => release.available)?.tag ?? "";
  const current = status.data?.current ?? "";
  const version = selected || latest || current;
  const isCurrent = !!current && normalizeVersion(version) === normalizeVersion(current);
  const isLatest = !!latest && normalizeVersion(latest) === normalizeVersion(current);
  const isBusy = status.data?.busy === true;
  const canInstall =
    !!status.data &&
    !isBusy &&
    !isCurrent &&
    versions.data?.some((release) => release.available && release.tag === version);
  const previous = normalizeVersion(status.data?.previous ?? "");
  return (
    <Card className="version-card">
      <CardHeader>
        <h2>{t("Обновление экземпляра")}</h2>
        <span className="version-current text-accent font-bold">
          {current ? normalizeVersion(current) : t("Не установлена")}
        </span>
        <Button
          type="button"
          size="icon"
          aria-label={t("Проверить версии HY2")}
          disabled={versions.isFetching || isBusy}
          onClick={() => void versions.refetch()}
        >
          <RefreshCw width={24} height={24} aria-hidden />
        </Button>
      </CardHeader>
      <div className="version-body p-3 grid gap-2">
        <div className="version-controls flex items-end gap-3 flex-wrap">
          <Field
            htmlFor="core-version"
            className="m-0 min-w-48 flex-1 max-tablet:min-w-0 max-tablet:basis-full"
          >
            <span className="flex items-center gap-2">
              {t("Версия")} <HysteriaBadge />
            </span>
            <Select
              id="core-version"
              aria-label={t("Версия HY2")}
              value={version}
              disabled={versions.isPending || isBusy || !!versions.error}
              onValueChange={setSelected}
            >
              <SelectOption value="">{t("Выберите версию")}</SelectOption>
              {current &&
                version === current &&
                !versions.data?.some((release) => release.tag === current) && (
                  <SelectOption value={current}>
                    {normalizeVersion(current)}
                    {t(" (установлена)")}
                  </SelectOption>
                )}
              {versions.data?.map((release) => (
                <ReleaseOption key={release.tag} release={release} current={current} />
              ))}
            </Select>
          </Field>
          <Button
            type="button"
            variant="primary"
            disabled={!canInstall}
            onClick={() => setConfirmation("install")}
          >
            <Download width={24} height={24} aria-hidden />
            {t(isCurrent ? "Установлена" : "Установить")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isBusy || !status.data?.rollbackAvailable}
            onClick={() => setConfirmation("rollback")}
          >
            <Undo2 width={24} height={24} aria-hidden />
            {t("Откатить")}
            {previous ? " " + previous : ""}
          </Button>
        </div>
        <Caption role="status">
          {versions.isPending
            ? t("Получаем версии с GitHub…")
            : versions.error
              ? t("Не удалось загрузить версии. Повторите проверку.")
              : isLatest
                ? t("Установлена последняя версия")
                : t("Файл проверяется по SHA-256. Предыдущая версия сохраняется для отката.")}
        </Caption>
        {status.data && <UpdateProgress status={status.data} />}
      </div>
      {confirmation && (
        <UpdateConfirmation
          mode={confirmation}
          version={confirmation === "rollback" ? (status.data?.previous ?? "") : version}
          onClose={() => setConfirmation(null)}
        />
      )}
    </Card>
  );
}
