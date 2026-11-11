import { CERTIFICATES_COPY } from "@/config/hysteria/structured/copy/certificates";
import { NETWORK_COPY } from "@/config/hysteria/structured/copy/network";
import { TRANSPORT_COPY } from "@/config/hysteria/structured/copy/transport";
export const FIELD_COPY = {
  ...TRANSPORT_COPY,
  ...CERTIFICATES_COPY,
  ...NETWORK_COPY,
};
