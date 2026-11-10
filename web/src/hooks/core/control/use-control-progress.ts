import { MUTATION_KEYS } from "@/config/network";
import { CONTROL_PROGRESS } from "@/hooks/core/control/control-messages";
import { useInstances } from "@/hooks/instances/use-instances";
import { type ICoreControlInput } from "@/services/core";
import { useMutationState } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export function useControlProgress() {
  const { t } = useTranslation();
  const operations = useMutationState({
    filters: { mutationKey: MUTATION_KEYS.coreControl, status: "pending" },
    select: (mutation) => ({
      // This key is populated only by useControlMutation with ICoreControlInput.
      input: mutation.state.variables as ICoreControlInput,
      key: mutation.mutationId,
    }),
  });
  const instances = useInstances(operations.length > 0);
  return operations.map(({ key, input }) => ({
    key,
    label: t(CONTROL_PROGRESS[input.action], {
      name: instances.data?.find((instance) => instance.id === input.id)?.name ?? input.id,
    }),
  }));
}
