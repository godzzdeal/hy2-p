import { DEVICES } from "@/config/i18n/english/settings/interface/devices";
import { EMOJI } from "@/config/i18n/english/settings/interface/emoji";
import { PORTS } from "@/config/i18n/english/settings/interface/ports";
import { INTERFACE as GENERAL } from "@/config/i18n/english/settings/interface/presentation/general";
import { PIXEL } from "@/config/i18n/english/settings/interface/presentation/pixel";
import { TOOLS } from "@/config/i18n/english/settings/interface/presentation/tools";
export const INTERFACE = { ...GENERAL, ...PORTS, ...EMOJI, ...PIXEL, ...DEVICES, ...TOOLS };
