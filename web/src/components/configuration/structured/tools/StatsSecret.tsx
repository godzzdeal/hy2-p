import { Caption } from "@/components/elements/Caption";
import { Button } from "@/components/ui/button/Button";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Notice } from "@/components/ui/feedback";
import { useCoreTools } from "@/hooks/configuration/tools/use-core-tools";
import { CopyButton } from "@/components/elements/copy";
import { useTranslation } from "react-i18next";
export function StatsSecret() {
  const { t } = useTranslation();
  const { stats } = useCoreTools();
  return (
    <section className="configuration-tools grid gap-4 min-w-0">
      <Notice>
        {t(
          "Панель задаёт trafficStats.listen и trafficStats.secret при запуске экземпляра. Ниже можно получить фактические значения панели.",
        )}
      </Notice>
      <Button
        type="button"
        variant="secondary"
        disabled={stats.isPending}
        onClick={() => (stats.data ? stats.reset() : stats.mutate())}
      >
        {t(stats.data ? "Скрыть" : "Показать")}
      </Button>
      {stats.data && (
        <>
          <p>
            {t("Адрес статистики")}: {stats.data.listen}
          </p>
          <Caption>
            {t(
              stats.data.running
                ? "Экземпляр запущен"
                : "Экземпляр остановлен. Значения применятся при запуске.",
            )}
          </Caption>
          <Field>
            trafficStats.secret
            <Input
              aria-label={t("Фактический секрет Traffic Stats")}
              readOnly
              value={stats.data.secret}
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <CopyButton value={stats.data.secret} label="Скопировать секрет" />
        </>
      )}
      <Caption>
        {t("Секрет может измениться при перезапуске панели. API статистики доступен только внутри сервера.")}
      </Caption>
    </section>
  );
}
