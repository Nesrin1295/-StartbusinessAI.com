import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignored = /^(?:deploy-|source-|startsmartai(?:[\\/]|$))/;
const files = [];
function walk(dir, rel = "") {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const next = path.join(rel, entry.name);
    if (ignored.test(next) || next.startsWith(".git") || next.startsWith("node_modules")) continue;
    if (entry.isDirectory()) walk(path.join(dir, entry.name), next);
    else if (entry.name.endsWith(".html")) files.push(next);
  }
}
walk(root);

const seen = { title: new Map(), description: new Map(), canonical: new Map() };
const issues = [];
const text = (value) => value.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
const addSeen = (kind, value, file) => {
  if (!value) return;
  const key = value.toLowerCase();
  const list = seen[kind].get(key) || [];
  list.push(file);
  seen[kind].set(key, list);
};

for (const file of files) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const titles = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => text(m[1]));
  const descriptions = [...html.matchAll(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*\bcontent=["']([^"']*)["'][^>]*>/gi)].map((m) => text(m[1]));
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => text(m[1]));
  const canonicals = [...html.matchAll(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map((m) => m[1]);
  const indexable = !/\bnoindex\b/i.test(html);
  for (const [name, values, expected] of [["title", titles, 1], ["description", descriptions, 1], ["h1", h1s, 1], ["canonical", canonicals, 1]]) {
    if (indexable && values.length !== expected) issues.push(`${file}: ${values.length} ${name} tags (expected 1)`);
  }
  if (titles[0] && (titles[0].length < 20 || titles[0].length > 65)) issues.push(`${file}: title length ${titles[0].length}`);
  if (descriptions[0] && (descriptions[0].length < 70 || descriptions[0].length > 170)) issues.push(`${file}: description length ${descriptions[0].length}`);
  addSeen("title", titles[0], file);
  addSeen("description", descriptions[0], file);
  addSeen("canonical", canonicals[0], file);
}

for (const [kind, values] of Object.entries(seen)) {
  for (const filesWithValue of values.values()) {
    if (filesWithValue.length > 1) issues.push(`Duplicate ${kind}: ${filesWithValue.join(", ")}`);
  }
}

console.log(`Audited ${files.length} production HTML files.`);
if (issues.length) {
  console.log(issues.join("\n"));
  process.exitCode = 1;
} else console.log("No core SEO tag or H1 issues found.");
