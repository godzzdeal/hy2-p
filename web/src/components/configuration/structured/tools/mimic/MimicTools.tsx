import { Button } from "@/components/ui/button/Button";
import { Notice } from "@/components/ui/feedback";
import { QueryState } from "@/components/ui/loading";
import { useMimicTools } from "@/hooks/configuration/tools";
import { MimicCheckRow } from "./MimicCheckRow";
import { MimicInstallation } from "./MimicInstallation";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "@/components/elements/icons";

export function MimicTools({ source }: { source: string }) {
  const { t } = useTranslation();
  const tools = useMimicTools(source);
  return (
    <section className="grid min-w-0 gap-4" aria-label={t("Проверка Mimic")}>
      <Notice variant="warning">
        {t(
          "Mimic нужен и на сервере, и на Linux-клиенте. Обычные клиенты на телефоне не подключатся. Нельзя совмещать с port hopping.",
        )}
      </Notice>
      {tools.shouldRecheck && <Notice>{t("Настройки изменились. Проверьте готовность ещё раз.")}</Notice>}
      <div className="flex min-w-0 items-center justify-between flex-wrap gap-3">
        <h3>{t("Готовность Mimic")}</h3>
        <Button type="button" variant="outline" disabled={tools.isPending} onClick={tools.onCheck}>
          {t(tools.isPending ? "Проверяем…" : "Проверить")}
        </Button>
      </div>
      <QueryState isLoading={tools.query.isPending} error={tools.query.error} />
      {tools.result && (
        <details>
          <summary>
            <ChevronRight width={20} height={20} aria-hidden />
            {t("Проверки")}: {tools.result.checks.filter((check) => check.ok).length}/
            {tools.result.checks.length}
          </summary>
          <ul className="m-0 grid min-w-0 list-none gap-x-4 pt-2 p-0 md:grid-cols-2">
            {tools.result.checks.map((check) => (
              <MimicCheckRow key={check.id} check={check} />
            ))}
          </ul>
        </details>
      )}
      {tools.result && (
        <p className="m-0 text-muted">
          {t("Интерфейсы")}: {tools.result.interfaces.join(", ") || t("Нет доступных")}
        </p>
      )}
      <MimicInstallation command={tools.installCommand} />
    </section>
  );
}
