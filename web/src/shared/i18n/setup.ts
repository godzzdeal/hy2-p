import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { ENGLISH } from "./english";
import { translateFallback } from "./messages";
const saved = localStorage.getItem("hy2.locale");
const language = saved === "en" ? "en" : "ru";
i18n.use({
  type: "postProcessor",
  name: "serverMessages",
  process: (value: string) => (i18n.language === "en" ? translateFallback(value) : value),
});
void i18n.use(initReactI18next).init({
  lng: language,
  fallbackLng: "ru",
  initAsync: false,
  postProcess: "serverMessages",
  keySeparator: false,
  nsSeparator: false,
  resources: {
    en: { translation: ENGLISH },
    ru: { translation: Object.fromEntries(Object.keys(ENGLISH).map((key) => [key, key])) },
  },
  interpolation: { escapeValue: false },
});
document.documentElement.lang = language;
i18n.on("languageChanged", (locale) => {
  document.documentElement.lang = locale;
  localStorage.setItem("hy2.locale", locale);
});
export { i18n };
