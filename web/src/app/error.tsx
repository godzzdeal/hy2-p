"use client";
import { Button } from "@/components/ui/button/Button";
import { EmptyState } from "@/components/ui/status/EmptyState";
import { useTranslation } from "react-i18next";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useTranslation();
  return (
    <EmptyState>
      <p>{t("Не удалось загрузить данные.")}</p>
      <Button onClick={reset}>{t("Повторить")}</Button>
    </EmptyState>
  );
}
