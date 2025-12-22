import { build } from "bun";
import { writeFile, chmod } from "fs/promises";
import { readFile } from "fs/promises";

// Build the bin entry point - this will be the main executable
// Using target: "node" ensures compatibility with both Node.js and Bun
const binResult = await build({
  entrypoints: ["./bin/termdev.ts"],
  outdir: "./bin",
  target: "node",
  format: "esm",
  minify: false,
  sourcemap: "external",
  // Keep dependencies external - they will be resolved at runtime
  external: [
    "chrome-remote-interface",
    "ink",
    "ink-text-input",
    "react",
  ],
});

if (!binResult.success) {
  console.error("Build failed:");
  for (const log of binResult.logs) {
    console.error(log);
  }
  process.exit(1);
}

// Add shebang to the output file
// The output will be termdev.js (or termdev.mjs depending on format)
const outputFile = binResult.outputs[0]?.path;
if (outputFile) {
  let content = await readFile(outputFile, "utf-8");
  // Replace or add shebang that works with both Node.js and Bun
  // Using 'node' as default - Bun can also run Node.js-compatible code
  const shebang = "#!/usr/bin/env node\n";
  if (content.startsWith("#!")) {
    // Replace existing shebang
    const lines = content.split("\n");
    lines[0] = shebang.trim();
    content = lines.join("\n");
  } else {
    // Add new shebang
    content = shebang + content;
  }
  await writeFile(outputFile, content);
  // Ensure executable permissions
  await chmod(outputFile, 0o755);
}

console.log("Build completed successfully!");
console.log("Output files:");
for (const output of binResult.outputs) {
  console.log(`  - ${output.path}`);
}
