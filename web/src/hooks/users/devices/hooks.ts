import { NETWORK, QUERY_KEYS } from "@/config/network";
import { devicesApi } from "@/services/users/devices/api";
import { type IDevices } from "@/services/users/devices/types";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
export function useDevices(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.devices, id],
    queryFn: () => devicesApi.read(id),
    refetchInterval: NETWORK.corePollMs,
  });
}
export function useDeviceCommands(id: string) {
  const client = useQueryClient();
  const { showError, notify } = useUiStore();
  const queryKey = [...QUERY_KEYS.devices, id];
  const saved = async (data: IDevices) => {
    client.setQueryData(queryKey, data);
    await client.invalidateQueries({ queryKey: ["connection", id] });
    await client.invalidateQueries({ queryKey: QUERY_KEYS.traffic });
    notify("Настройки устройств сохранены");
  };
  const limit = useMutation({
    mutationFn: (value: number) => devicesApi.limit(id, value),
    onSuccess: saved,
    onError: showError,
  });
  const remove = useMutation({
    mutationFn: (device: string) => devicesApi.remove(id, device),
    onSuccess: saved,
    onError: showError,
  });
  const edit = useMutation({
    mutationFn: (input: { device: string; blocked: boolean }) =>
      devicesApi.edit(id, input.device, input.blocked),
    onMutate: async (input) => {
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData<IDevices>(queryKey);
      if (previous)
        client.setQueryData(queryKey, {
          ...previous,
          devices: previous.devices.map((item) =>
            item.id === input.device ? { ...item, blocked: input.blocked } : item,
          ),
        });
      return { previous };
    },
    onSuccess: saved,
    onError: (error, _input, context) => {
      if (context?.previous) client.setQueryData(queryKey, context.previous);
      showError(error);
    },
  });
  return { limit, edit, remove };
}
