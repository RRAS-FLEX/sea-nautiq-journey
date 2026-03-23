import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["src", "public", "index.html", ".env.example", "README.md", "SUPABASE_SETUP.md"];
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git"]);
const TEXT_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".html", ".css", ".sql", ".env", ".txt", ".yml", ".yaml"]);

const secretPatterns = [
  {
    name: "Service role key assignment",
    regex: /(service_role\s*[:=]\s*['\"](?!your|example|placeholder|changeme|set-me|redacted)[A-Za-z0-9._-]{30,}['\"]|SUPABASE_SERVICE_ROLE_KEY\s*=\s*['\"]?(?!your|example|placeholder|changeme|set-me|redacted)[A-Za-z0-9._-]{30,})/i,
  },
  {
    name: "Supabase secret key assignment",
    regex: /SUPABASE_SECRET(?:_KEY)?\s*=\s*['\"]?(?!your|example|placeholder|changeme|set-me|redacted)[A-Za-z0-9._-]{30,}/i,
  },
  {
    name: "Hardcoded JWT-like token",
    regex: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9._-]{20,}\.[A-Za-z0-9._-]{10,}/,
  },
];

const findings = [];

const shouldScanFile = (filePath) => {
  const ext = extname(filePath).toLowerCase();
  if (TEXT_EXTS.has(ext)) return true;
  return ["index.html", ".env.example"].includes(filePath.split(/[/\\]/).pop() ?? "");
};

const walk = (currentPath, relative = "") => {
  const stats = statSync(currentPath);
  if (stats.isDirectory()) {
    const dirName = relative.split(/[\\/]/).pop() || relative;
    if (IGNORE_DIRS.has(dirName)) return;

    for (const entry of readdirSync(currentPath)) {
      const abs = join(currentPath, entry);
      const rel = relative ? `${relative}/${entry}` : entry;
      walk(abs, rel);
    }
    return;
  }

  if (!shouldScanFile(relative)) return;

  let content = "";
  try {
    content = readFileSync(currentPath, "utf8");
  } catch {
    return;
  }

  for (const pattern of secretPatterns) {
    if (pattern.regex.test(content)) {
      findings.push({ file: relative, pattern: pattern.name });
    }
  }
};

for (const target of TARGET_DIRS) {
  const abs = join(ROOT, target);
  try {
    walk(abs, target);
  } catch {
    // Skip missing target
  }
}

if (findings.length === 0) {
  console.log("✅ Secret scan passed: no risky frontend patterns found in scanned paths.");
  process.exit(0);
}

console.error("❌ Secret scan failed. Potential issues:");
for (const finding of findings) {
  console.error(`- ${finding.file}: ${finding.pattern}`);
}
process.exit(1);
