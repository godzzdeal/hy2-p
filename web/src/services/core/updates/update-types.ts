export const UpdatePhaseEnum = {
  Idle: "idle",
  Downloading: "downloading",
  Verifying: "verifying",
  Restarting: "restarting",
  RollingBack: "rolling_back",
  Success: "success",
  RolledBack: "rolled_back",
  Failed: "failed",
} as const;
export type TUpdatePhase = (typeof UpdatePhaseEnum)[keyof typeof UpdatePhaseEnum];
export interface IReleaseVersion {
  tag: string;
  published: string;
  available: boolean;
}
export interface IUpdateStatus {
  current: string;
  previous: string;
  busy: boolean;
  rollbackAvailable: boolean;
  result: {
    phase: TUpdatePhase;
    message: string;
    target: string;
    started: string;
  };
}
export const UPDATE_TIMING = { pollMs: 1500, releaseStaleMs: 60000 } as const;
export const UPDATE_LABELS: Record<TUpdatePhase, string> = {
  idle: "Готово к обновлению",
  downloading: "Загрузка версии",
  verifying: "Проверка файла",
  restarting: "Проверка запуска",
  rolling_back: "Восстановление",
  success: "Обновление завершено",
  rolled_back: "Выполнен откат",
  failed: "Операция не выполнена",
};
