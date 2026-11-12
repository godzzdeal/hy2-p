import { useMutation } from "@tanstack/react-query";
import { type IConfiguration } from "@/services/configuration/configuration-types";
import { useUiStore } from "@/store/ui-store";
import { isMap, parseDocument } from "yaml";
const MAX_YAML_BYTES = 1024 * 1024;
export function useConfigurationFile(value: IConfiguration, onChange: (value: IConfiguration) => void) {
  const notify = useUiStore((state) => state.notify);
  const showError = useUiStore((state) => state.showError);
  return useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_YAML_BYTES) throw new Error("Размер YAML-файла не должен превышать 1 МБ");
      const config = await file.text();
      const document = parseDocument(config);
      if (
        document.errors.length ||
        !isMap(document.contents) ||
        (!document.has("tls") && !document.has("acme"))
      )
        throw new Error("Некорректный YAML: нужен один документ с разделом tls или acme");
      const listen: unknown = document.get("listen");
      const port = typeof listen === "string" ? listen.match(/:(\d+)$/)?.[1] : undefined;
      return {
        ...value,
        config,
        authMode: document.has("auth") ? ("native" as const) : ("panel" as const),
        port: port ?? value.port,
      };
    },
    onSuccess: (next) => {
      onChange(next);
      notify("YAML загружен в черновик. Проверьте настройки и сохраните конфигурацию.");
    },
    onError: showError,
  });
}
