import { useSaveGroup } from "@/hooks/groups/hooks";
import { useInstances } from "@/hooks/instances/use-instances";
import { type IGroup, type IGroupInput } from "@/services/groups/types";
import { AccessMode } from "@/services/users/access/types";
import { MAX_USER_DEVICES } from "@/services/users/devices/types";
import { BYTE_UNITS } from "@/services/users/traffic/traffic-types";
import { useForm, useWatch } from "react-hook-form";

interface IGroupForm extends Omit<IGroupInput, "trafficLimit"> {
  trafficGigabytes: number;
}

export function useGroupForm(group: IGroup | undefined, onClose: () => void) {
  const form = useForm<IGroupForm>({
    defaultValues: {
      name: group?.name ?? "",
      color: group?.color ?? "cyan",
      access: group?.access ?? { mode: AccessMode.All, instances: [] },
      deviceLimit: group?.deviceLimit ?? 0,
      trafficGigabytes: (group?.trafficLimit ?? 0) / BYTE_UNITS.gigabyte,
    },
  });
  const access = useWatch({ control: form.control, name: "access" });
  const instances = useInstances();
  const eligible =
    instances.data?.filter(
      (instance) => !instance.removing && instance.authMode !== "native" && !instance.error,
    ) ?? [];
  const save = useSaveGroup();
  function onSubmit({ trafficGigabytes, ...value }: IGroupForm) {
    save.mutate(
      { id: group?.id, body: { ...value, trafficLimit: Math.round(trafficGigabytes * BYTE_UNITS.gigabyte) } },
      { onSuccess: onClose },
    );
  }
  function onMode(mode: string) {
    if (mode !== AccessMode.All && mode !== AccessMode.Selected) return;
    form.setValue("access", {
      mode,
      instances: mode === AccessMode.All ? [] : eligible.map((instance) => instance.id),
    });
  }
  function onToggle(id: string, isChecked: boolean) {
    form.setValue(
      "access.instances",
      isChecked ? [...access.instances, id] : access.instances.filter((instance) => instance !== id),
    );
  }
  return {
    form,
    isPending: save.isPending,
    onSubmit,
    policy: {
      access,
      eligible,
      isAll: access.mode === AccessMode.All,
      isLoading: instances.isPending,
      error: instances.error,
      onMode,
      onToggle,
      traffic: form.register("trafficGigabytes", {
        valueAsNumber: true,
        required: true,
        min: 0,
        max: Number.MAX_SAFE_INTEGER / BYTE_UNITS.gigabyte,
      }),
      devices: form.register("deviceLimit", {
        valueAsNumber: true,
        required: true,
        min: 0,
        max: MAX_USER_DEVICES,
      }),
    },
  };
}
