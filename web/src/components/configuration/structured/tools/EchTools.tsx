import { Caption } from "@/components/elements/Caption";
import { Field } from "@/components/ui/fields/Field";
import { Input } from "@/components/ui/fields/controls/Input";
import { Actions } from "@/components/ui/Actions";
import { Button } from "@/components/ui/button/Button";
import { Textarea } from "@/components/ui/fields/controls/Textarea";
import { Notice } from "@/components/ui/feedback";
import { useEchFields } from "@/hooks/configuration/tools";
import { type IEch } from "@/services/configuration/tools/api";
import { useUiStore } from "@/store/ui-store";
import { CopyButton } from "@/components/elements/copy";
import { useTranslation } from "react-i18next";
export function EchTools({
  keyPath,
  onSet,
}: {
  keyPath: string;
  onSet: (path: string, value: unknown) => void;
}) {
  const { t } = useTranslation();
  const { read, generate, result, name, onName } = useEchFields(keyPath);
  const notify = useUiStore((state) => state.notify);
  function onGenerated(value: IEch) {
    onSet("ech.keyPath", value.keyPath);
    notify("Ключ ECH создан. Сохраните конфигурацию и перезапустите экземпляр.");
  }
  return (
    <section className="configuration-tools grid gap-4 p-4 min-w-0">
      <Notice>
        {t(
          "ACME обновляет TLS-сертификат. ECH создаётся отдельно; клиентам передаётся только публичный tls.ech.",
        )}
      </Notice>
      <Field>
        {t("Внешнее имя SNI для ECH")}
        <Input
          value={name}
          onChange={(event) => onName(event.target.value)}
          placeholder="public.example.com"
        />
      </Field>
      <Actions>
        <Button
          aria-label={t("Создать ключ ECH")}
          type="button"
          variant="secondary"
          disabled={!name || generate.isPending}
          onClick={() => {
            generate.mutate(name, { onSuccess: onGenerated });
          }}
        >
          {t(generate.isPending ? "Создаём ECH…" : "Создать")}
        </Button>
        <Button
          aria-label={t("Получить публичный ECH")}
          type="button"
          variant="secondary"
          disabled={read.isFetching || generate.isPending || !keyPath}
          onClick={() => void read.refetch()}
        >
          {t("Получить")}
        </Button>
      </Actions>
      {read.isSuccess && !result?.configList && (
        <Caption>{t("ECH ещё не настроен в сохранённой конфигурации.")}</Caption>
      )}
      {result?.configList && (
        <Field>
          tls.ech
          <Textarea aria-label="tls.ech" readOnly value={result.configList} rows={3} />
          <CopyButton value={result.configList} label="Скопировать tls.ech" />
        </Field>
      )}
      <Caption>
        {t(
          "Публичный ECH добавляется в ссылку подключения. После замены ключа обновите подписку. Клиент должен поддерживать ECH для Hysteria2.",
        )}
      </Caption>
    </section>
  );
}
