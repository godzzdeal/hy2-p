import { EmojiText } from "@/components/elements/emoji/text/EmojiText";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
export function ConnectionQr({
  value,
  name,
  isSubscription,
}: {
  value: string;
  name: string;
  isSubscription: boolean;
}) {
  const { t } = useTranslation();
  const label = t(isSubscription ? "QR-код подписки" : "QR-код подключения");
  return (
    <figure className="connection-qr">
      <div className="qr-brand">
        <span>HY2-P</span>
        <span>{t(isSubscription ? "Подписка" : "Подключение")}</span>
      </div>
      <div className="qr-canvas">
        <QRCodeSVG
          value={value}
          size={224}
          level="M"
          marginSize={4}
          role="img"
          title={label}
          aria-label={label}
          fgColor="var(--qr-foreground, #000000)"
          bgColor="var(--qr-background, #ffffff)"
        />
      </div>
      <figcaption>
        <EmojiText value={name} />
      </figcaption>
    </figure>
  );
}
