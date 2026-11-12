import { QUERY_KEYS } from "@/config/network";
import { certificateApi } from "@/services/configuration/structured/certificate-api";
import { instanceKey } from "@/services/instances/scope";
import { useInstanceId } from "@/store/core/instance-store";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ICertificateStatus } from "@/services/configuration/structured/certificate-api";

export function useCertificateRemoval() {
  const client = useQueryClient();
  const notify = useUiStore((state) => state.notify);
  const showError = useUiStore((state) => state.showError);
  return useMutation({
    mutationFn: ({ certificateId, instanceId }: { certificateId: string; instanceId: string }) =>
      certificateApi.remove(certificateId, instanceId),
    onMutate: async ({ certificateId, instanceId }) => {
      const key = instanceKey(QUERY_KEYS.hy2Certificates, instanceId);
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<ICertificateStatus>(key);
      client.setQueryData<ICertificateStatus>(
        key,
        (current) =>
          current && {
            ...current,
            certificates: current.certificates.filter((item) => item.id !== certificateId),
          },
      );
      return { previous, key };
    },
    onError: (error, _, context) => {
      if (context?.previous) client.setQueryData(context.key, context.previous);
      showError(error);
    },
    onSuccess: () => notify("Сертификат удалён"),
    onSettled: (_, __, variables) =>
      client.invalidateQueries({ queryKey: instanceKey(QUERY_KEYS.hy2Certificates, variables.instanceId) }),
  });
}

export function useCertificates(isEnabled = true) {
  const id = useInstanceId();
  return useQuery({
    queryKey: instanceKey(QUERY_KEYS.hy2Certificates, id),
    queryFn: () => certificateApi.read(id),
    enabled: isEnabled,
  });
}

export function useCertificateUpload(onUploaded: (certificate: string, key: string) => void) {
  const id = useInstanceId();
  const client = useQueryClient();
  const showError = useUiStore((state) => state.showError);
  return useMutation({
    mutationFn: (body: Parameters<typeof certificateApi.upload>[0]) => certificateApi.upload(body, id),
    onSuccess: (result) => {
      onUploaded(result.certificatePath, result.keyPath);
      return client.invalidateQueries({ queryKey: instanceKey(QUERY_KEYS.hy2Certificates, id) });
    },
    onError: showError,
    gcTime: 0,
  });
}
