import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import serveStatic from "serve-static";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(
  "/api/splitwise",
  createProxyMiddleware({
    target: "https://secure.splitwise.com/api",
    changeOrigin: true,
  })
);

app.use(
  "/api/toshl",
  createProxyMiddleware({
    target: "https://api.toshl.com/",
    changeOrigin: true,
  })
);

// Catch-all route handler (used for production, when the static site is compiled)
// Not used in dev, in dev the api is served via a proxy in the vite config
app.use(serveStatic("./dist", { index: ["index.html"] }));
app.get("*", (req, res) => {
  res.sendFile(resolve(__dirname, "dist", "index.html"));
});

app.listen(5544, () => {
  console.log("Server started at http://localhost:5544");
});
