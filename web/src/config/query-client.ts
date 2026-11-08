import { NETWORK } from "@/config/network";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: NETWORK.staleMs, retry: 1 } },
});
