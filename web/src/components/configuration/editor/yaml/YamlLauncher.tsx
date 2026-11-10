import { Card } from "@/components/ui/cards/Card";
import { CardHeader } from "@/components/ui/cards/CardHeader";
import { Actions } from "@/components/ui/Actions";
import { Button } from "@/components/ui/button/Button";
import { FileCode2, History } from "@/components/elements/icons";
import { useTranslation } from "react-i18next";
export function YamlLauncher({ onOpen, onHistory }: { onOpen: () => void; onHistory: () => void }) {
  const { t } = useTranslation();
  return (
    <Card id="config-yaml" data-scroll-section data-scroll-label={t("Редактор YAML")}>
      <CardHeader>
        <div>
          <h2>{t("Редактор YAML")}</h2>
        </div>
        <Actions>
          <Button type="button" variant="secondary" onClick={onHistory}>
            <History width={24} height={24} aria-hidden />
            {t("История")}
          </Button>
          <Button type="button" variant="primary" onClick={onOpen}>
            <FileCode2 width={24} height={24} aria-hidden />
            {t("Открыть")}
          </Button>
        </Actions>
      </CardHeader>
    </Card>
  );
}
