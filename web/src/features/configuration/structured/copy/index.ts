import { TRANSPORT_COPY } from "./transport";
import { CERTIFICATES_COPY } from "./certificates";
import { NETWORK_COPY } from "./network";
export const FIELD_COPY = { ...TRANSPORT_COPY, ...CERTIFICATES_COPY, ...NETWORK_COPY };
