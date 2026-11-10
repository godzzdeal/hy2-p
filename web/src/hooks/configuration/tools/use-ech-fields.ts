import { QUERY_KEYS } from "@/config/network";
import { coreToolsApi, type IEch } from "@/services/configuration/tools/api";
import { instanceKey } from "@/services/instances/scope";
import { useInstanceId } from "@/store/core/instance-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function useEchFields(keyPath: string) {
  const id = useInstanceId();
  const client = useQueryClient();
  const [edited, setEdited] = useState<{ path: string; name: string } | null>(null);
  const key = (path: string) => [...instanceKey(QUERY_KEYS.ech, id), path];
  const read = useQuery({
    queryKey: key(keyPath),
    queryFn: () => coreToolsApi.read(id, keyPath),
    enabled: !!keyPath,
  });
  const generate = useMutation({
    mutationFn: (name: string) => coreToolsApi.generate(name, id),
    gcTime: 0,
    onSuccess: (result: IEch, name) => {
      client.setQueryData(key(result.keyPath), { ...result, publicName: result.publicName || name });
      setEdited(null);
    },
  });
  return {
    read,
    generate,
    result: read.data,
    name: edited?.path === keyPath ? edited.name : (read.data?.publicName ?? ""),
    onName: (name: string) => setEdited({ path: keyPath, name }),
  };
}
