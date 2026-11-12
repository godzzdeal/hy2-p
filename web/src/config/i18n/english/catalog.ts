import { COMMON } from "@/config/i18n/english/general/common";
import { CLOUD_STORAGE } from "@/config/i18n/english/cloud-storage";
import { DEMO_TRANSLATIONS } from "@/config/i18n/english/demo";
import { ENGINE } from "@/config/i18n/english/general/engine";
import { ERRORS } from "@/config/i18n/english/general/errors";
import { HELP } from "@/config/i18n/english/help";
import { PANEL } from "@/config/i18n/english/panel";
import { CONFIGURATION } from "@/config/i18n/english/settings/configuration";
import { INTERFACE } from "@/config/i18n/english/settings/interface";
import { ADMINISTRATION } from "@/config/i18n/english/settings/panel/administration";
import { INSTANCES } from "@/config/i18n/english/settings/panel/instances";
import { TRANSFER } from "@/config/i18n/english/settings/panel/transfer";
import { NETWORK } from "@/config/i18n/english/settings/network";
import { SYSTEM } from "@/config/i18n/english/settings/system";
import { PANEL_OPERATIONS, CHART_PREFERENCES } from "@/config/i18n/english/settings/maintenance";
export const ENGLISH = {
  ...CLOUD_STORAGE,
  ...PANEL_OPERATIONS,
  ...CHART_PREFERENCES,
  ...SYSTEM,
  ...NETWORK,
  ...TRANSFER,
  ...DEMO_TRANSLATIONS,
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
