import { useMutation, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/config/network";
import { mimicApi } from "@/services/configuration/tools";
import { instanceKey } from "@/services/instances/scope";
import { useInstanceId } from "@/store/core/instance-store";
import { useUiStore } from "@/store/ui-store";

export function useMimicTools(source: string) {
  const id = useInstanceId();
  const notify = useUiStore((state) => state.notify);
  const showError = useUiStore((state) => state.showError);
  const query = useQuery({ queryKey: instanceKey(QUERY_KEYS.mimic, id), queryFn: () => mimicApi.read(id) });
  const check = useMutation({
    mutationFn: mimicApi.check,
    onError: showError,
    onSuccess: (result) => notify(result.ready ? "Mimic готов к запуску" : "Проверьте требования Mimic"),
  });
  const isCurrent = check.variables?.id === id && check.variables?.source === source;
  return {
    id,
    query,
    result: isCurrent ? (check.data ?? query.data) : query.data,
    isPending: check.isPending || query.isFetching,
    shouldRecheck: Boolean(check.data) && !isCurrent,
    onCheck: () => check.mutate({ source, id }),
    installCommand: "sudo hy2-panel mimic-setup --instance " + id,
  };
}
