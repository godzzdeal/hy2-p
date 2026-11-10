import { Notice } from "@/components/ui/feedback";
import { CompatibilityNotice } from "@/components/elements/CompatibilityNotice";
import { useCoreTools } from "@/hooks/configuration/tools/use-core-tools";
import { type IEch } from "@/services/configuration/tools/api";
import { useUiStore } from "@/store/ui-store";
import { CopyButton } from "@/components/elements/copy";
import { useState } from "react";
import { useTranslation } from "react-i18next";
export function EchTools({ onSet }: { onSet: (path: string, value: unknown) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const { read, generate } = useCoreTools();
  const notify = useUiStore((state) => state.notify);
  const result = generate.data ?? read.data;
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
          onChange={(event) => setName(event.target.value)}
          placeholder="public.example.com"
        />
      </label>
      <div className="row-actions">
        <button
          type="button"
          className="secondary"
          disabled={!name || generate.isPending}
          onClick={() => {
            read.reset();
            generate.mutate(name, { onSuccess: onGenerated });
          }}
        >
          {t(generate.isPending ? "Создаём ECH…" : "Создать ключ ECH")}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={read.isPending || generate.isPending}
          onClick={() => {
            generate.reset();
            read.mutate();
          }}
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
      <CompatibilityNotice />
    </section>
  );
}
