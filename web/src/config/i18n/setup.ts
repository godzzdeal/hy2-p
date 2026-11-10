import { languageBackend, translateServerMessage } from "@/config/i18n/backend";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
const saved = localStorage.getItem("hy2.locale");
const language = saved === "en" ? "en" : "ru";
i18n.use({
  type: "postProcessor",
  name: "serverMessages",
  process: (value: string) => (i18n.language === "en" ? translateServerMessage(value) : value),
});
void i18n
  .use(languageBackend)
  .use(initReactI18next)
  .init({
    lng: language,
    fallbackLng: "ru",
    initAsync: false,
    postProcess: "serverMessages",
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
  })
  .catch((error: unknown) => console.error("Language initialization failed", error));
document.documentElement.lang = language;
i18n.on("languageChanged", (locale) => {
  document.documentElement.lang = locale;
  localStorage.setItem("hy2.locale", locale);
});
export { i18n };
