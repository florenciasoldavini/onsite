const { spawnSync } = require("node:child_process");
const { createReadStream, existsSync, statSync } = require("node:fs");
const { createServer } = require("node:http");
const { extname, join, normalize } = require("node:path");

const projectRoot = join(__dirname, "..");
const outputRoot = join(projectRoot, "dist");
const port = Number(process.env.E2E_WEB_PORT ?? 4173);
const build = spawnSync("npm", ["run", "build"], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit"
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function resolveRequestPath(requestUrl = "/") {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://local").pathname);
  const relativePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const candidates = [
    join(outputRoot, relativePath),
    join(outputRoot, `${relativePath}.html`),
    join(outputRoot, relativePath, "index.html")
  ];

  return candidates.find(
    (candidate) => existsSync(candidate) && statSync(candidate).isFile()
  );
}

const server = createServer((request, response) => {
  const filePath = resolveRequestPath(request.url);

  if (!filePath) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "cache-control": "no-store",
    "content-type":
      mimeTypes[extname(filePath)] ?? "application/octet-stream"
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`E2E web server listening on http://127.0.0.1:${port}\n`);
});

function closeServer() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);
