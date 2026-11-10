import { NETWORK } from "@/config/network";
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { useUiStore } from "@/store/ui-store";
import { notifyQueryError, notifyQuerySuccess } from "@/config/query/notifications";

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error.name !== "AbortError") useUiStore.getState().showError(error);
    },
  }),
  queryCache: new QueryCache({ onError: notifyQueryError, onSuccess: notifyQuerySuccess }),
  defaultOptions: { queries: { staleTime: NETWORK.staleMs, retry: 1 } },
});
