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
    <section className="configuration-tools">
      <Notice>
        {t(
          "ACME обновляет TLS-сертификат. ECH создаётся отдельно; клиентам передаётся только публичный tls.ech.",
        )}
      </Notice>
      <label>
        {t("Внешнее имя SNI для ECH")}
        <input
          value={name}
          onChange={(event) => onName(event.target.value)}
          placeholder="public.example.com"
        />
      </label>
      <div className="row-actions">
        <button
          type="button"
          className="secondary"
          disabled={!name || generate.isPending}
          onClick={() => {
            generate.mutate(name, { onSuccess: onGenerated });
          }}
        >
          {t(generate.isPending ? "Создаём ECH…" : "Создать ключ ECH")}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={read.isFetching || generate.isPending || !keyPath}
          onClick={() => void read.refetch()}
        >
          {t("Получить публичный ECH")}
        </button>
      </div>
      {read.isSuccess && !result?.configList && (
        <p className="caption">{t("ECH ещё не настроен в сохранённой конфигурации.")}</p>
      )}
      {result?.configList && (
        <label>
          tls.ech
          <textarea aria-label="tls.ech" readOnly value={result.configList} rows={3} />
          <CopyButton value={result.configList} label="Скопировать tls.ech" />
        </label>
      )}
      <p className="caption">
        {t(
          "Публичный ECH добавляется в ссылку подключения. После замены ключа обновите подписку. Клиент должен поддерживать ECH для Hysteria2.",
        )}
      </p>
    </section>
  );
}
