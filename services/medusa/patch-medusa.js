const fs = require("fs");
const path = require("path");

// List of services that need patching (all use the same bulk update pattern)
const servicesToPatch = [
  "payment-provider.js",
  "notification.js",
  "fulfillment-provider.js",
  "tax-provider.js",
];

const search = "return [4 /*yield*/, model.update({}, { is_installed: false })];";
const replacement = "return [4 /*yield*/, Promise.resolve()];";

let patchedCount = 0;
let skippedCount = 0;
let notFoundCount = 0;

for (const serviceFile of servicesToPatch) {
  const targetPath = path.join(
    __dirname,
    "node_modules",
    "@medusajs",
    "medusa",
    "dist",
    "services",
    serviceFile
  );

  if (!fs.existsSync(targetPath)) {
    console.log(`  [SKIP] ${serviceFile} - file not found (may not exist in this Medusa version)`);
    notFoundCount++;
    continue;
  }

  let src = fs.readFileSync(targetPath, "utf8");

  if (src.includes(replacement)) {
    console.log(`  [OK] ${serviceFile} - already patched`);
    skippedCount++;
    continue;
  }

  if (!src.includes(search)) {
    console.log(`  [SKIP] ${serviceFile} - pattern not found (may not need patching)`);
    notFoundCount++;
    continue;
  }

  src = src.replace(search, replacement);
  fs.writeFileSync(targetPath, src, "utf8");
  console.log(`  [PATCHED] ${serviceFile} - disabled bulk is_installed reset`);
  patchedCount++;
}

console.log(`\nMedusa patch summary: ${patchedCount} patched, ${skippedCount} already patched, ${notFoundCount} skipped/not found`);

if (patchedCount === 0 && skippedCount === 0) {
  console.error("ERROR: No services were patched. Medusa version may have changed.");
  process.exit(1);
}

