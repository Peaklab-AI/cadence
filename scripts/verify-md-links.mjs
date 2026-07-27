#!/usr/bin/env node
// Checks that relative links in tracked markdown files point to real files.
// http(s)/mailto links, absolute paths, and anchors (after '#') are skipped.
// No dependencies — uses Node builtins only.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const linkTarget = /\[[^\]]*\]\(([^)\s#]+)/g;
const ignoredPrefixes = ["http://", "https://", "mailto:", "/"];

function trackedMarkdownFiles() {
  const out = execFileSync("git", ["ls-files", "*.md"], { cwd: root, encoding: "utf8" });
  return out.split("\n").filter(Boolean);
}

function brokenLinksIn(relPath) {
  const absPath = resolve(root, relPath);
  const lines = readFileSync(absPath, "utf8").split("\n");
  const broken = [];
  lines.forEach((line, i) => {
    for (const match of line.matchAll(linkTarget)) {
      const target = match[1];
      if (ignoredPrefixes.some((prefix) => target.startsWith(prefix))) continue;
      if (!existsSync(resolve(dirname(absPath), target))) {
        broken.push(`${relPath}:${i + 1} -> ${target}`);
      }
    }
  });
  return broken;
}

const problems = trackedMarkdownFiles().flatMap(brokenLinksIn);

if (problems.length > 0) {
  console.error("broken markdown links:");
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log("no broken markdown links");
