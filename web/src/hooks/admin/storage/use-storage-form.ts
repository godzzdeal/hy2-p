import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  STORAGE_DEFAULTS,
  STORAGE_PROVIDER_KEY,
  isBrowserStorage,
  storageApi,
  type IStorage,
  type IStorageFields,
  type IStorageProvider,
  type IStorageApplication,
  type TStorageProvider,
} from "@/services/admin/storage";
import { useStorageAuthorization } from "@/hooks/admin/storage/use-storage-authorization";
import { useUiStore } from "@/store/ui-store";
import { BACKUP_LIMITS } from "@/config/network";

export function useStorageForm(
  onSave: (input: IStorageFields) => Promise<void>,
  account?: IStorage,
  onComplete?: () => void,
) {
  const form = useForm<IStorageFields>({ defaultValues: { ...STORAGE_DEFAULTS, ...account } });
  const provider = form.watch("provider");
  const providers = useQuery({
    queryKey: STORAGE_PROVIDER_KEY,
    queryFn: storageApi.providers,
    retry: false,
    enabled: !account && isBrowserStorage(provider),
  });
  const { pending, complete, isWaiting, setWaiting } = useStorageAuthorization(onComplete);
  const save = useMutation({
    mutationFn: async (values: IStorageFields) => {
      if (account || !isBrowserStorage(values.provider)) {
        await onSave(values);
        return;
      }
      const popup = window.open("about:blank", "hy2-cloud-connect", "popup,width=640,height=720");
      try {
        const authorization = await storageApi.authorize({ ...values, origin: window.location.origin });
        const url = new URL(authorization.url);
        const hosts = [
          "oauth.yandex.ru",
          "accounts.google.com",
          "www.dropbox.com",
          "login.microsoftonline.com",
        ];
        if (url.protocol !== "https:" || !hosts.includes(url.hostname))
          throw new Error("Некорректный адрес авторизации");
        const origin = new URL(authorization.origin);
        if (origin.origin !== window.location.origin)
          throw new Error("Некорректный ответ сервиса авторизации");
        pending.current = { state: authorization.state, origin: origin.origin, popup };
        setWaiting(true);
        if (popup) popup.location.href = authorization.url;
        else window.location.assign(authorization.url);
      } catch (error) {
        popup?.close();
        throw error;
      }
    },
  });
  async function onFile(file: File) {
    if (file.size > BACKUP_LIMITS.configBytes) throw new Error("Максимальный размер: 256 КБ");
    form.setValue("configText", await file.text(), { shouldDirty: true });
  }
  const isBrowser = !account && isBrowserStorage(provider);
  const application = providers.data?.providers.find((item) => item.id === provider);
  const canConnect = !isBrowser || !!application?.hasSecret;
  return {
    form,
    provider,
    providers,
    onFile,
    onSubmit: form.handleSubmit((values) => save.mutate(values)),
    isBusy: save.isPending || complete.isPending,
    canConnect,
    isBrowser,
    isWaiting,
    application,
  };
}

export function useProviderSetup(provider: TStorageProvider, application?: IStorageProvider) {
  const client = useQueryClient();
  const form = useForm<IStorageApplication>({
    defaultValues: { provider, clientId: application?.clientId ?? "", clientSecret: "", origin: "" },
  });
  const save = useMutation({
    mutationFn: storageApi.saveProvider,
    onSuccess: async () => {
      form.setValue("clientSecret", "");
      await client.invalidateQueries({ queryKey: STORAGE_PROVIDER_KEY });
      useUiStore.getState().notify("Настройки входа сохранены");
    },
  });
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return {
    form,
    isSaving: save.isPending,
    callbackURL: origin + "/connect/callback/" + provider,
    onSave: () => save.mutate({ ...form.getValues(), provider, origin }),
  };
}
