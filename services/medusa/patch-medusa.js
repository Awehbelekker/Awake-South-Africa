const fs = require("fs");
const path = require("path");

// List of services that need patching (all use the same bulk update pattern)
const servicesToPatch = [
  "payment-provider.js",
  "notification.js",
  "fulfillment-provider.js",
  "tax-provider.js",
];

// Patterns to search for (different services use different variable names)
const searchPatterns = [
  {
    search: "return [4 /*yield*/, model.update({}, { is_installed: false })];",
    replacement: "return [4 /*yield*/, Promise.resolve()];",
  },
  {
    search: "return [4 /*yield*/, fulfillmentProviderRepo.update({}, { is_ins",
    replacement: "return [4 /*yield*/, Promise.resolve()]; // fulfillmentProviderRepo.update({}, { is_ins",
    partial: true, // This line is truncated in the compiled code, so we do partial match
  },
];

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
  let patched = false;

  // Try each search pattern
  for (const pattern of searchPatterns) {
    if (pattern.partial) {
      // For partial matches, check if the pattern exists and replace the whole line
      if (src.includes(pattern.search)) {
        // Find the line and replace it
        const lines = src.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(pattern.search)) {
            // Replace the entire line
            const indent = lines[i].match(/^\s*/)[0];
            lines[i] = indent + pattern.replacement;
            patched = true;
            break;
          }
        }
        if (patched) {
          src = lines.join("\n");
          break;
        }
      }
    } else {
      // Exact match
      if (src.includes(pattern.replacement)) {
        console.log(`  [OK] ${serviceFile} - already patched`);
        skippedCount++;
        patched = "skip";
        break;
      }
      if (src.includes(pattern.search)) {
        src = src.replace(pattern.search, pattern.replacement);
        patched = true;
        break;
      }
    }
  }

  if (patched === "skip") {
    continue;
  }

  if (!patched) {
    console.log(`  [SKIP] ${serviceFile} - pattern not found (may not need patching)`);
    notFoundCount++;
    continue;
  }

  fs.writeFileSync(targetPath, src, "utf8");
  console.log(`  [PATCHED] ${serviceFile} - disabled bulk is_installed reset`);
  patchedCount++;
}

console.log(`\nMedusa patch summary: ${patchedCount} patched, ${skippedCount} already patched, ${notFoundCount} skipped/not found`);

if (patchedCount === 0 && skippedCount === 0) {
  console.error("ERROR: No services were patched. Medusa version may have changed.");
  process.exit(1);
}

