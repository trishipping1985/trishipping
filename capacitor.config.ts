import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.trishipping.app",
  appName: "TRI Shipping",
  webDir: "out",
  server: {
    url: "https://trishipping.info",
    cleartext: false,
  },
};

export default config;