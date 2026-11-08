import { QUERY_KEYS } from "@/config/network";
import { type QueryClient } from "@tanstack/react-query";

export function endSession(client: QueryClient): void {
  client.setQueryData(QUERY_KEYS.session, { ok: false });
  // Keep active session and public port-progress observers attached to their queries.
  client.removeQueries({
    predicate: (query) =>
      query.queryKey[0] !== QUERY_KEYS.session[0] && query.queryKey[0] !== QUERY_KEYS.udpOperation[0],
  });
  client.getMutationCache().clear();
}
