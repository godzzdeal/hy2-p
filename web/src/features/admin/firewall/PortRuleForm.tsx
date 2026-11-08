import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectOption } from "@/shared/ui/select";
import { type IPortRule } from "./model";
export function PortRuleForm({
  isPending,
  onApply,
}: {
  isPending: boolean;
  onApply: (rule: IPortRule) => void;
}) {
  const { t } = useTranslation();
  const [port, setPort] = useState("");
  const [protocol, setProtocol] = useState<"tcp" | "udp">("tcp");
  const [action, setAction] = useState<"allow" | "deny">("allow");
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (action === "deny" && !window.confirm(t("Закрыть порт? Существующие подключения могут прерваться.")))
      return;
    onApply({ port: Number(port), protocol, action });
  }
  return (
    <form onSubmit={onSubmit}>
      <div className="field-grid">
        <label>
          {t("Порт")}
          <input
            type="number"
            min={1}
            max={65535}
            required
            value={port}
            onChange={(event) => setPort(event.target.value)}
            disabled={isPending}
          />
        </label>
        <label>
          {t("Протокол")}
          <Select
            value={protocol}
            onValueChange={(value) => {
              if (value === "tcp" || value === "udp") setProtocol(value);
            }}
            disabled={isPending}
          >
            <SelectOption value="tcp">TCP</SelectOption>
            <SelectOption value="udp">UDP</SelectOption>
          </Select>
        </label>
        <label>
          {t("Действие")}
          <Select
            value={action}
            onValueChange={(value) => {
              if (value === "allow" || value === "deny") setAction(value);
            }}
            disabled={isPending}
          >
            <SelectOption value="allow">{t("Открыть порт")}</SelectOption>
            <SelectOption value="deny">{t("Закрыть порт")}</SelectOption>
          </Select>
        </label>
      </div>
      <button className="primary" disabled={isPending}>
        {t(isPending ? "Применяем…" : "Применить правило")}
      </button>
    </form>
  );
}
