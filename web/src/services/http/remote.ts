import { ApiError } from "@/services/http/ApiError";
import { API_ROUTES } from "@/config/network";
import { type IRequest } from "@/services/http/client";
export async function request<T>(path: string, options: IRequest = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api" + path, {
      method: options.method ?? "GET",
      signal: options.signal,
      headers: { "Content-Type": "application/json", "X-Panel-Request": "1" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    if (
      options.signal?.aborted &&
      options.signal.reason instanceof Error &&
      options.signal.reason.name === "AbortError"
    )
      throw options.signal.reason;
    throw new ApiError("Панель недоступна. Проверьте соединение и повторите действие.", 0);
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("Панель вернула некорректный ответ. Повторите действие позже.", response.status);
  }
  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
        ? data.error
        : "Не удалось выполнить запрос";
    if (response.status === 401 && path !== API_ROUTES.login && path !== API_ROUTES.cloudLogin)
      window.dispatchEvent(new Event("session-expired"));
    throw new ApiError(message, response.status);
  }
  return data as T; // API responses follow the shared HTTP contracts.
}
