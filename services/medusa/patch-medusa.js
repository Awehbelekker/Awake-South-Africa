const fs = require("fs");
const path = require("path");

const targetPath = path.join(
  __dirname,
  "node_modules",
  "@medusajs",
  "medusa",
  "dist",
  "services",
  "payment-provider.js"
);

if (!fs.existsSync(targetPath)) {
  console.error("Medusa patch: target file not found:", targetPath);
  process.exit(0);
}

let src = fs.readFileSync(targetPath, "utf8");

if (src.includes("return [4 /*yield*/, Promise.resolve()];")) {
  console.log("Medusa PaymentProviderService already patched; skipping.");
  process.exit(0);
}

const search = "return [4 /*yield*/, model.update({}, { is_installed: false })];";
const replacement = "return [4 /*yield*/, Promise.resolve()];";

if (!src.includes(search)) {
  console.error("Medusa patch: target pattern not found; Medusa version may have changed.");
  process.exit(1);
}

src = src.replace(search, replacement);
fs.writeFileSync(targetPath, src, "utf8");
console.log("Medusa PaymentProviderService patched: disabled bulk is_installed reset.");

