import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { assertEagerBundleBudget, type JavaScriptAsset } from "./bundle-budget.ts";

const assetDirectory = join(process.cwd(), "dist", "assets");
const fileNames = (await readdir(assetDirectory)).filter((fileName) => fileName.endsWith(".js"));
const assets: JavaScriptAsset[] = await Promise.all(
  fileNames.map(async (fileName) => ({
    fileName,
    bytes: (await stat(join(assetDirectory, fileName))).size,
  })),
);

assertEagerBundleBudget(assets);
