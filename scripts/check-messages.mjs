// Checks that every English message key has an Indonesian translation and vice versa.
// Usage: node scripts/check-messages.mjs
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "src", "messages");

function flatten(value, prefix = "", out = new Map()) {
    for (const [key, child] of Object.entries(value)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (child && typeof child === "object") flatten(child, path, out);
        else out.set(path, child);
    }
    return out;
}

let problems = 0;
for (const file of readdirSync(join(root, "en"))) {
    const read = (locale) => flatten(JSON.parse(readFileSync(join(root, locale, file), "utf8")));
    const en = read("en");
    const id = read("id");
    const namespace = file.replace(/\.json$/, "");

    for (const key of en.keys()) {
        if (!id.has(key)) { console.log(`missing in id: ${namespace}.${key}`); problems++; }
    }
    for (const key of id.keys()) {
        if (!en.has(key)) { console.log(`only in id:    ${namespace}.${key}`); problems++; }
    }
}

console.log(problems ? `\n${problems} problem(s)` : "en and id messages match");
process.exit(problems ? 1 : 0);
