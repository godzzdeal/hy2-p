import { HELP } from "./help";
import { PANEL } from "./panel";
import { COMMON } from "./common";
import { CONFIGURATION } from "./settings/configuration";
import { ADMINISTRATION } from "./settings/administration";
import { ENGINE } from "./engine";
import { ERRORS } from "./errors";
import { INTERFACE } from "./settings/interface";
import { INSTANCES } from "./settings/instances";
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
