import { type BackendModule } from "i18next";
import { useNotifications } from "@/store/notifications";

let fallback = (message: string) => message;
export function translateServerMessage(message: string): string {
  return fallback(message);
}

export const languageBackend: BackendModule = {
  type: "backend",
  init() {},
  read(language, _, callback) {
    if (language !== "en") {
      callback(null, {});
      return;
    }
    void Promise.all([
      import(/* webpackChunkName: "locale-en" */ "@/config/i18n/english/catalog"),
      import(/* webpackChunkName: "locale-en" */ "@/config/i18n/messages"),
    ])
      .then(([catalog, messages]) => {
        fallback = messages.translateFallback;
        callback(null, catalog.ENGLISH);
      })
      .catch((error: unknown) => {
        useNotifications.getState().push("Не удалось загрузить английский язык", true);
        callback(error instanceof Error ? error : new Error("Translation load failed"), false);
      });
  },
};
