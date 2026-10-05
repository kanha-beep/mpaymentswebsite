#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";

const filePath = resolve(process.argv[2] ?? "");
const envFile = await readFile(resolve(".env"), "utf8").catch(() => "");
const env = Object.fromEntries(
  envFile
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const [key, ...value] = line.split("=");
      return [key.trim(), value.join("=").trim()];
    }),
);
const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY ?? env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET ?? env.CLOUDINARY_API_SECRET;

if (!process.argv[2] || !cloudName || !apiKey || !apiSecret) {
  console.error(
    "Usage: CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=... node scripts/upload-cloudinary.mjs <image-path>",
  );
  process.exit(1);
}

const timestamp = Math.floor(Date.now() / 1000);
const folder = "images";
const signature = createHash("sha1")
  .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
  .digest("hex");
const image = await readFile(filePath);
const extension = extname(filePath).toLowerCase();
const mimeType = extension === ".png" ? "image/png" : "application/octet-stream";

const form = new FormData();
form.append("file", new Blob([image], { type: mimeType }), basename(filePath));
form.append("api_key", apiKey);
form.append("folder", folder);
form.append("timestamp", String(timestamp));
form.append("signature", signature);

const response = await fetch(
  `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  { method: "POST", body: form },
);
const result = await response.json();

if (!response.ok) {
  throw new Error(result?.error?.message ?? `Cloudinary upload failed (${response.status})`);
}

console.log(result.secure_url);
