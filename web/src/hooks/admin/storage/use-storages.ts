import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  storageApi,
  STORAGE_QUERY_KEY,
  type IStorages,
  type IStorage,
  type TStorageChange,
} from "@/services/admin/storage";
import { useUiStore } from "@/store/ui-store";
import { useState } from "react";
import { usePanelOperation } from "@/hooks/panel/maintenance";
import { usePanelOperationStore } from "@/store/core/panel-operation-store";
import type { IStorageFields } from "@/services/admin/storage";

export function useStorages() {
  const client = useQueryClient();
  const settings = useQuery({ queryKey: STORAGE_QUERY_KEY, queryFn: storageApi.read });
  const change = useMutation({
    mutationFn: storageApi.change,
    onMutate: async (input: TStorageChange) => {
      await client.cancelQueries({ queryKey: STORAGE_QUERY_KEY });
      const previous = client.getQueryData<IStorages>(STORAGE_QUERY_KEY);
      if (input.action === "delete" && previous)
        client.setQueryData(STORAGE_QUERY_KEY, {
          accounts: previous.accounts.filter((account) => account.id !== input.id),
        });
      return { previous };
    },
    onSuccess: (accounts: IStorage[], input) => {
      client.setQueryData(STORAGE_QUERY_KEY, { accounts });
      useUiStore.getState().notify(input.action === "delete" ? "Хранилище отключено" : "Хранилище сохранено");
    },
    onError: (_error, _input, context) => {
      if (context?.previous) client.setQueryData(STORAGE_QUERY_KEY, context.previous);
    },
  });
  return { settings, change };
}

export function useStorageList() {
  const model = useStorages();
  const operation = usePanelOperation();
  const isActive = usePanelOperationStore((state) => !!state.active);
  const [editing, setEditing] = useState<IStorage | null | undefined>();
  const [removing, setRemoving] = useState<IStorage | null>(null);
  async function onSave(values: IStorageFields) {
    await model.change.mutateAsync(
      editing
        ? { action: "update", id: editing.id, name: values.name, folder: values.folder }
        : { ...values, action: "create" },
    );
    setEditing(undefined);
  }
  function onDisconnect() {
    if (removing)
      model.change.mutate({ action: "delete", id: removing.id }, { onSuccess: () => setRemoving(null) });
  }
  return {
    ...model,
    operation,
    editing,
    setEditing,
    removing,
    setRemoving,
    onSave,
    onDisconnect,
    isBusy: isActive || model.change.isPending || operation.isPending,
  };
}
