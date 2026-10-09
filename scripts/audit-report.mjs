import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["audit", "--json"], {
  encoding: "utf8",
  maxBuffer: 16 * 1024 * 1024,
});

let report;
try {
  report = JSON.parse(result.stdout || "{}");
} catch {
  console.error("NPM_AUDIT_REPORT: npm audit returned invalid JSON.");
  if (result.stderr) console.error(result.stderr);
  process.exit(0);
}

const summary = report.metadata?.vulnerabilities ?? {};
console.log("NPM_AUDIT_SUMMARY", JSON.stringify(summary));

for (const [name, item] of Object.entries(report.vulnerabilities ?? {})) {
  const v = item;
  const via = (v.via ?? []).map((entry) =>
    typeof entry === "string"
      ? entry
      : { title: entry.title, url: entry.url, severity: entry.severity, range: entry.range }
  );
  console.log("NPM_AUDIT_PACKAGE", JSON.stringify({
    name,
    severity: v.severity,
    isDirect: v.isDirect,
    range: v.range,
    fixAvailable: v.fixAvailable,
    via,
  }));
}

if (result.error) console.error("NPM_AUDIT_EXECUTION_ERROR", result.error.message);
// Audit reporting must not block production deployment by itself.
process.exit(0);
