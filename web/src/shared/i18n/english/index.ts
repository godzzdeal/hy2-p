import { HELP } from "./help";
import { COMMON } from "./common";
import { CONFIGURATION } from "./settings/configuration";
import { ADMINISTRATION } from "./settings/administration";
import { ENGINE } from "./engine";
import { ERRORS } from "./errors";
import { INTERFACE } from "./settings/interface";
export const ENGLISH = {
  ...HELP,
  ...INTERFACE,
  ...COMMON,
  ...CONFIGURATION,
  ...ADMINISTRATION,
  ...ENGINE,
  ...ERRORS,
};
