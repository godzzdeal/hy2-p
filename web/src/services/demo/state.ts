import { initialDemoState } from "@/services/demo/data";
import { ApiError } from "@/services/http/ApiError";
export const demoState = initialDemoState();
export function demoInput<T extends object>(value: unknown): T {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ApiError("Неверные параметры", 400);
  return value as T; // Callers are the same typed service wrappers used by the live API.
}
export function demoId(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 16);
}
export function unavailable(): never {
  throw new ApiError(
    "Эта операция доступна после установки панели на свой сервер. Демоверсия работает только в браузере.",
    400,
  );
}
