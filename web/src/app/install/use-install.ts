import { useEffect } from "react";
import { useInstallStore, type IInstallPrompt } from "./store";
export function useInstall() {
  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const update = () =>
      useInstallStore
        .getState()
        .setInstalled(display.matches || ("standalone" in navigator && navigator.standalone === true));
    const onPrompt = (event: Event) => {
      if (!("prompt" in event) || typeof event.prompt !== "function") return;
      event.preventDefault();
      // Chromium's install event extends Event after the feature check above.
      useInstallStore.getState().setPrompt(event as IInstallPrompt);
    };
    const onInstalled = () => useInstallStore.getState().setInstalled(true);
    update();
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    display.addEventListener("change", update);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      display.removeEventListener("change", update);
    };
  }, []);
}
