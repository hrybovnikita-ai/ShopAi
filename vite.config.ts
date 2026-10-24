import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// The Base44 sandbox serves the dev server through a preview proxy: requests
// arrive with the sandbox host name, and the local Supabase API is reached
// through the compose gateway on the same origin. Both are sandbox-only, so
// they are gated on BASE44_PREVIEW_MODE and leave normal development untouched.
const previewMode = process.env.BASE44_PREVIEW_MODE === "1";
const gatewayUrl = process.env.BASE44_GATEWAY_URL ?? "http://gateway:8000";

const previewServer = previewMode
  ? {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
      allowedHosts: [
        process.env.BASE44_SANDBOX_HOST_DOMAIN
          ? `.${process.env.BASE44_SANDBOX_HOST_DOMAIN}`
          : undefined,
        process.env.BASE44_PUBLIC_HOST_SUFFIX
          ? `3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`
          : undefined,
      ].filter((host): host is string => Boolean(host)),
      proxy: {
        "/auth": { target: gatewayUrl, changeOrigin: true },
        "/rest": { target: gatewayUrl, changeOrigin: true },
        "/functions": { target: gatewayUrl, changeOrigin: true },
      },
    }
  : undefined;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  ...(previewServer ? { server: previewServer } : {}),
});
