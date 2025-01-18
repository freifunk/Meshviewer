import { Config } from "./config_default";
import { Router } from "./utils/router";

export {};

declare global {
  interface Window {
    config: Config;
    router: Router;
  }
}
