import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { imagetools } from "vite-imagetools";
import type { Plugin } from "vite";

/** Serves the Netlify Function API locally during `vite dev`. */
function devApi(): Plugin {
  return {
    name: "dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        try {
          const { handleApi } = (await server.ssrLoadModule("/server/api-handler.ts")) as {
            handleApi: (path: string, request: Request) => Promise<Response>;
          };

          const url = new URL(req.url, "http://localhost");
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);

          const request = new Request(url, {
            method: req.method ?? "GET",
            headers: req.headers as Record<string, string>,
            ...(chunks.length ? { body: Buffer.concat(chunks) } : {}),
          });

          const response = await handleApi(url.pathname.replace(/^\/api/, ""), request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          console.error(error);
          res.statusCode = 500;
          res.end("Server error");
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    imagetools({
      defaultDirectives: (url) =>
        /\.(jpe?g|png)$/i.test(url.pathname)
          ? new URLSearchParams({ format: "webp", quality: "72" })
          : new URLSearchParams(),
    }),
    devApi(),
  ],
  server: {
    host: "::",
    port: 8080,
  },
});
