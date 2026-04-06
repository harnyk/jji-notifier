import { build } from "esbuild";
import { execSync } from "child_process";
import { mkdirSync } from "fs";

const outDir = "dist/lambda";
mkdirSync(outDir, { recursive: true });

const shared = {
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  sourcemap: true,
  outExtension: { ".js": ".mjs" },
  external: ["@aws-sdk/*"],
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
};

await build({ ...shared, entryPoints: ["src/index.ts"], outfile: `${outDir}/fetch.mjs` });
await build({ ...shared, entryPoints: ["src/notify.ts"], outfile: `${outDir}/notify.mjs` });

execSync(`cd ${outDir} && zip fetch.zip fetch.mjs fetch.mjs.map && zip notify.zip notify.mjs notify.mjs.map`);

console.log("Build complete: dist/lambda/fetch.zip, dist/lambda/notify.zip");
