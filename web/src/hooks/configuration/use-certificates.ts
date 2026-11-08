import { QUERY_KEYS } from "@/config/network";
import { certificateApi } from "@/services/configuration/structured/certificate-api";
import { instanceKey } from "@/services/instances/scope";
import { useInstanceId } from "@/store/core/instance-store";
import { useUiStore } from "@/store/ui-store";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useCertificates() {
  const id = useInstanceId();
  return useQuery({
    queryKey: instanceKey(QUERY_KEYS.hy2Certificates, id),
    queryFn: () => certificateApi.read(id),
  });
}

export function useCertificateUpload(onUploaded: (certificate: string, key: string) => void) {
  const id = useInstanceId();
  const showError = useUiStore((state) => state.showError);
  return useMutation({
    mutationFn: (body: Parameters<typeof certificateApi.upload>[0]) => certificateApi.upload(body, id),
    onSuccess: (result) => onUploaded(result.certificatePath, result.keyPath),
    onError: showError,
    gcTime: 0,
  });
}
