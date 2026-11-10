export const CONTROL_PROGRESS = {
  start: "Запускаем экземпляр «{{name}}»…",
  stop: "Останавливаем экземпляр «{{name}}»…",
  restart: "Перезапускаем экземпляр «{{name}}»…",
} as const;
export const CONTROL_SUCCESS = {
  start: "Экземпляр запущен.",
  stop: "Экземпляр остановлен.",
  restart: "Экземпляр перезапущен.",
} as const;
