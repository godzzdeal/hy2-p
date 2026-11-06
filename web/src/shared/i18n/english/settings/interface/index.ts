import { PIXEL } from "./presentation";
import { EMOJI } from "./emoji";
import { INTERFACE as GENERAL } from "./presentation";
import { PORTS } from "./ports";
import { DEVICES } from "./devices";
export const INTERFACE = { ...GENERAL, ...PORTS, ...EMOJI, ...PIXEL, ...DEVICES };
