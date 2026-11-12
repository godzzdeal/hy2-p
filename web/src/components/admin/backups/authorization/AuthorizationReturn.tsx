"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/cards/Card";
import { CardBody } from "@/components/ui/cards/CardBody";
import { Notice } from "@/components/ui/feedback";
import { useTranslation } from "react-i18next";

interface IAuthorizationReturn {
  state: string;
  code: string;
  hasError: boolean;
}
export function AuthorizationReturn({ state, code, hasError }: IAuthorizationReturn) {
  const [origin, setOrigin] = useState("");
  const { t } = useTranslation();
  const payload = { type: "hy2-cloud-authorization", state, code, hasError };
  const target = origin + "/settings#cloudAuth=" + encodeURIComponent(JSON.stringify(payload));
  useEffect(() => {
    const origin = window.location.origin;
    setOrigin(origin);
    if (window.opener) {
      window.opener.postMessage({ type: "hy2-cloud-authorization", state, code, hasError }, origin);
      window.close();
    }
  }, [state, code, hasError]);
  return (
    <main className="mx-auto max-w-2xl p-6">
      <Card>
        <CardBody>
          <h1>{t(hasError ? "Доступ не разрешён" : "Доступ разрешён")}</h1>
          <Notice variant={hasError ? "warning" : "info"}>
            {t("Вернитесь в панель, чтобы завершить подключение.")}
          </Notice>
          <a className="text-accent underline" href={target}>
            {t("Вернуться в панель")}: {origin}
          </a>
        </CardBody>
      </Card>
    </main>
  );
}
