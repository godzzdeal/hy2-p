export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
interface IRequest {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}
export async function request<T>(path: string, options: IRequest = {}): Promise<T> {
  const response = await fetch("/api" + path, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json", "X-Panel-Request": "1" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
        ? data.error
        : "Не удалось выполнить запрос";
    if (response.status === 401 && path !== "/login") window.dispatchEvent(new Event("session-expired"));
    throw new ApiError(message, response.status);
  }
  return data as T; // API responses follow the shared HTTP contracts.
}
