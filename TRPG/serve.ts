import { file, serve } from "bun";
import { join } from "path";

const ROOT = import.meta.dir;
const PORT = Number(process.env.PORT) || 3000;

const MIME: Record<string, string> = {
  html: "text/html; charset=utf-8",
  css:  "text/css",
  js:   "application/javascript",
  json: "application/json",
  png:  "image/png",
  jpg:  "image/jpeg",
  svg:  "image/svg+xml",
  ico:  "image/x-icon",
  pl:   "text/plain",
  ts:   "text/plain",
};

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname === "/" ? "/ai_trpg_gm.html" : url.pathname;
    // prevent path traversal
    const safePath = join(ROOT, pathname.replace(/\.\./g, ""));
    const f = file(safePath);
    if (!(await f.exists())) {
      return new Response("Not found", { status: 404 });
    }
    const ext = safePath.split(".").pop() ?? "";
    const ct = MIME[ext] ?? "application/octet-stream";
    return new Response(f, { headers: { "Content-Type": ct } });
  },
});

console.log(`Serving ${ROOT} on http://localhost:${PORT}/`);
