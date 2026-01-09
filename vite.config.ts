import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dtsPlugin from "vite-plugin-dts";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), dtsPlugin({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.tsx"),
      name: "ClientDidntPayGuard",
      fileName: (format) => `client-didnt-pay-guard.${format}.js`,
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});
