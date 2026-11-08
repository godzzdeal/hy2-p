import { COMMON } from "@/config/i18n/english/general/common";
import { ENGINE } from "@/config/i18n/english/general/engine";
import { ERRORS } from "@/config/i18n/english/general/errors";
import { HELP } from "@/config/i18n/english/help";
import { PANEL } from "@/config/i18n/english/panel";
import { CONFIGURATION } from "@/config/i18n/english/settings/configuration";
import { INTERFACE } from "@/config/i18n/english/settings/interface";
import { ADMINISTRATION } from "@/config/i18n/english/settings/panel/administration";
import { INSTANCES } from "@/config/i18n/english/settings/panel/instances";
export const ENGLISH = {
  ...PANEL,
  ...HELP,
  ...INTERFACE,
  ...INSTANCES,
  ...COMMON,
  ...CONFIGURATION,
  ...ADMINISTRATION,
  ...ENGINE,
  ...ERRORS,
};
