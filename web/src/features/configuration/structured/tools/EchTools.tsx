import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "@/app/state";
import { useCoreTools, copyValue, type IEch } from "./model";
export function EchTools({ onSet }: { onSet: (path: string, value: unknown) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const { read, generate } = useCoreTools();
  const notify = useUiStore((state) => state.notify);
  const showError = useUiStore((state) => state.showError);
  const result = generate.data ?? read.data;
  const error = generate.error ?? read.error;
  function onGenerated(value: IEch) {
    onSet("ech.keyPath", value.keyPath);
    notify("Ключ ECH создан. Сохраните конфигурацию и перезапустите ядро.");
  }
  return (
    <section className="configuration-tools">
      <p className="config-note">
        {t(
          "ACME обновляет TLS-сертификат. ECH создаётся отдельно; клиентам передаётся только публичный tls.ech.",
        )}
      </p>
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
      {error && (
        <p role="alert" className="inline-error">
          {t(error.message)}
        </p>
      )}
      {read.isSuccess && !result?.configList && (
        <p className="caption">{t("ECH ещё не настроен в сохранённой конфигурации.")}</p>
      )}
      {result?.configList && (
        <label>
          tls.ech
          <textarea aria-label="tls.ech" readOnly value={result.configList} rows={3} />
          <button
            type="button"
            className="secondary"
            onClick={() =>
              void copyValue(result.configList)
                .then(() => notify("Скопировано"))
                .catch(showError)
            }
          >
            {t("Скопировать tls.ech")}
          </button>
        </label>
      )}
      <p className="caption">
        {t(
          "При замене ключа ECH обновите tls.ech на клиентах. Экспорт ECH в ссылки Happ пока не поддерживается.",
        )}
      </p>
    </section>
  );
}
