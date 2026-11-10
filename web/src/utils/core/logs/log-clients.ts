import { type IUser } from "@/services/users/user-types";
import { filterLogs } from "@/utils/core/logs/log-text";

const CLIENT_ID = /^([a-f0-9]{16})(?:\.([a-f0-9]{32})\.[a-f0-9]{16})?$/;
export interface ILogClient {
  name: string;
  identity: string;
  userId: string;
  deviceId?: string;
}
export interface ILogEntry {
  text: string;
  client?: ILogClient;
}

export function resolveLogClient(text: string, users: ReadonlyMap<string, IUser>): ILogClient | undefined {
  const start = text.indexOf("{");
  if (start < 0) return;
  try {
    const fields: unknown = JSON.parse(text.slice(start));
    if (!fields || typeof fields !== "object" || !("id" in fields) || typeof fields.id !== "string") return;
    const match = CLIENT_ID.exec(fields.id);
    const user = match && users.get(match[1]);
    if (user)
      return {
        name: user.displayName ?? user.name,
        identity: fields.id,
        userId: user.id,
        deviceId: match?.[2],
      };
  } catch {
    /* Non-JSON log messages keep their original text. */
  }
}
export function logEntries(
  text: string,
  users: readonly IUser[],
  search: string,
  level: Parameters<typeof filterLogs>[2],
  userId = "",
): ILogEntry[] {
  const index = new Map(users.map((user) => [user.id, user]));
  const query = search.toLocaleLowerCase();
  return filterLogs(text, "", level)
    .map((line) => ({ text: line, client: resolveLogClient(line, index) }))
    .filter(
      (entry) =>
        (!userId || entry.client?.userId === userId) &&
        (!query ||
          entry.text.toLocaleLowerCase().includes(query) ||
          entry.client?.name.toLocaleLowerCase().includes(query)),
    );
}
