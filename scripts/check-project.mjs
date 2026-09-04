import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const root = resolve(import.meta.dirname, "..");
const appJson = JSON.parse(readFileSync(resolve(root, "app.json"), "utf8"));
const errors = [];

for (const page of appJson.pages) {
  for (const extension of ["ts", "json", "wxml", "wxss"]) {
    const file = resolve(root, `${page}.${extension}`);
    if (!existsSync(file)) errors.push(`Missing ${page}.${extension}`);
  }
  const wxmlPath = resolve(root, `${page}.wxml`);
  const sourcePath = resolve(root, `${page}.ts`);
  if (existsSync(wxmlPath) && existsSync(sourcePath)) {
    const wxml = readFileSync(wxmlPath, "utf8");
    const source = readFileSync(sourcePath, "utf8");
    validateWxml(page, wxml, errors);
    const handlers = [...wxml.matchAll(/\bbind(?:tap|input|change|touchstart|touchend|touchcancel)="([A-Za-z_$][\w$]*)"/g)].map((match) => match[1]);
    for (const handler of new Set(handlers)) {
      if (!new RegExp(`\\b${handler}\\s*\\(`).test(source)) errors.push(`Missing handler ${handler} in ${page}.ts`);
    }
  }
}

for (const item of appJson.tabBar.list) {
  if (!appJson.pages.includes(item.pagePath)) errors.push(`Tab page not registered: ${item.pagePath}`);
}

function walk(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(folder, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

for (const file of walk(resolve(root, "packages/core"))) {
  if (!file.endsWith(".ts")) continue;
  const source = readFileSync(file, "utf8");
  if (/\bwx\./.test(source) || /window\.|document\./.test(source)) errors.push(`Platform API leaked into core: ${file}`);
  if (/openai|anthropic|gemini/i.test(source)) errors.push(`Model SDK leaked into core: ${file}`);
}

for (const file of walk(resolve(root, "apps/wechat-miniprogram/pages"))) {
  if (!file.endsWith(".json")) continue;
  try { JSON.parse(readFileSync(file, "utf8")); } catch (error) { errors.push(`Invalid JSON: ${file}`); }
}

function validateWxml(page, source, issues) {
  const stack = [];
  const voidTags = new Set(["input", "image", "icon", "progress", "checkbox", "radio", "switch", "slider"]);
  const tags = source.matchAll(/<\s*(\/?)\s*([a-z][\w-]*)([^>]*)>/gi);
  for (const match of tags) {
    const closing = Boolean(match[1]);
    const tag = match[2];
    const tail = match[3];
    const selfClosing = /\/\s*$/.test(tail) || voidTags.has(tag);
    if (closing) {
      const expected = stack.pop();
      if (expected !== tag) issues.push(`Unbalanced WXML in ${page}: expected </${expected}> but found </${tag}>`);
    } else if (!selfClosing) stack.push(tag);
  }
  if (stack.length) issues.push(`Unclosed WXML tag in ${page}: <${stack[stack.length - 1]}>`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Project check passed: ${appJson.pages.length} pages, ${appJson.tabBar.list.length} tabs, core is platform-independent.`);
