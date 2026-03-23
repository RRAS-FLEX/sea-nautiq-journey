import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { vitePrerenderPlugin } from "vite-prerender-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // When VITE_TAILSCALE_HOST is set (e.g. my-machine.tail1234.ts.net),
  // Vite's HMR WebSocket is told to connect back to that hostname so live
  // reload works on any device connected via Tailscale.
  const tailscaleHost = process.env.VITE_TAILSCALE_HOST?.trim();
  const allowedHosts = Array.from(
    new Set(
      [
        "localhost",
        "127.0.0.1",
        "desk-jojos.tail9d3e44.ts.net",
        tailscaleHost,
        ...(process.env.VITE_ALLOWED_HOSTS?.split(",").map((host) => host.trim()).filter(Boolean) ?? []),
      ].filter((host): host is string => Boolean(host)),
    ),
  );

  return {
  server: {
    host: "0.0.0.0",   // bind all interfaces — required for Tailscale access
    port: 8080,
    strictPort: false,  // fall back to next free port if 8080 is taken
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL?.trim() || "http://localhost:4242",
        changeOrigin: true,
      },
    },
    allowedHosts,
    hmr: tailscaleHost
      ? {
          host: tailscaleHost,
          clientPort: 8080,
          overlay: false,
        }
      : {
          overlay: false,
        },
  },
  plugins: [
    react(),
    vitePrerenderPlugin({
      renderTarget: "#root",
      prerenderScript: path.resolve(__dirname, "./src/prerender.tsx"),
      additionalPrerenderRoutes: ["/", "/boats", "/destinations", "/about"],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
