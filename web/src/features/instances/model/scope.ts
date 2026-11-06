import { DEFAULT_INSTANCE } from "./types";
export function instanceRoute(path: string, id = DEFAULT_INSTANCE): string {
  return id === DEFAULT_INSTANCE ? path : "/instances/" + encodeURIComponent(id) + path;
}
export function instanceKey(key: readonly string[], id = DEFAULT_INSTANCE): readonly string[] {
  return id === DEFAULT_INSTANCE ? key : [...key, id];
}
