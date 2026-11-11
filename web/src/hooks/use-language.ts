import { useEffect } from "react";
import { i18n } from "@/config/i18n/setup";
import { useUiStore } from "@/store/ui-store";

export function useLanguage() {
  useEffect(() => {
    let language = "ru";
    try {
      language = localStorage.getItem("hy2.locale") === "en" ? "en" : "ru";
    } catch {
      /* Use Russian when browser storage is unavailable. */
    }
    void i18n.changeLanguage(language).catch(useUiStore.getState().showError);
  }, []);
}
