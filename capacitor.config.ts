import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "info.trishipping.twa",
  appName: "TRI Shipping",
  webDir: "out",
  server: {
    url: "https://trishipping.info",
    cleartext: false,
  },
};

export default config;