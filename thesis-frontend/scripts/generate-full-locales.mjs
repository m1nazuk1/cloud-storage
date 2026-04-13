/**
 * Builds complete locale JSON from en.base.json (google-translate-api-x).
 * Preserves {{placeholder}} segments.
 * Usage: node scripts/generate-full-locales.mjs [es|be|ka|az|zh|ar|all]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { translate } from 'google-translate-api-x';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE_PATH = path.join(ROOT, 'src/i18n/locales/en.base.json');

const TARGETS = {
    es: 'es',
    be: 'be',
    ka: 'ka',
    az: 'az',
    zh: 'zh-CN',
    ar: 'ar',
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function protectPlaceholders(str) {
    const parts = [];
    const masked = String(str).replace(/\{\{[^}]+\}\}/g, (m) => {
        const i = parts.length;
        parts.push(m);
        return `⟦${i}⟧`;
    });
    return { masked, parts };
}

function restorePlaceholders(str, parts) {
    let out = String(str);
    parts.forEach((val, i) => {
        out = out.split(`⟦${i}⟧`).join(val);
        out = out.split(`[[${i}]]`).join(val);
    });
    return out;
}

async function translateValue(text, to) {
    if (!text || !String(text).trim())
        return text;
    const { masked, parts } = protectPlaceholders(String(text));
    if (!masked.trim())
        return text;
    try {
        const res = await translate(masked, { to });
        const raw = typeof res === 'object' && res !== null && 'text' in res ? res.text : String(res);
        return restorePlaceholders(raw, parts);
    }
    catch (e) {
        console.error('translate fail:', String(text).slice(0, 50), e.message);
        return text;
    }
}

async function runLang(lang) {
    const to = TARGETS[lang];
    if (!to) {
        console.error('Unknown lang', lang);
        process.exit(1);
    }
    const base = JSON.parse(fs.readFileSync(BASE_PATH, 'utf8'));
    const keys = Object.keys(base).sort();
    const partialPath = path.join(ROOT, `src/i18n/locales/.gen-${lang}.partial.json`);
    const out = {};
    if (fs.existsSync(partialPath)) {
        try {
            Object.assign(out, JSON.parse(fs.readFileSync(partialPath, 'utf8')));
            console.error(lang, 'resuming, have', Object.keys(out).length, 'keys');
        }
        catch {
            void 0;
        }
    }
    let n = 0;
    for (const k of keys) {
        if (out[k] !== undefined && out[k] !== '')
            continue;
        out[k] = await translateValue(base[k], to);
        n++;
        if (n % 25 === 0) {
            fs.writeFileSync(partialPath, JSON.stringify(out, null, 2), 'utf8');
            console.error(lang, Object.keys(out).length, '/', keys.length);
        }
        await delay(40);
    }
    const dest = path.join(ROOT, `src/i18n/locales/${lang}.json`);
    fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf8');
    if (fs.existsSync(partialPath))
        fs.unlinkSync(partialPath);
    console.log('Wrote', dest, Object.keys(out).length, 'keys');
}

const arg = process.argv[2] || 'all';
async function main() {
    if (arg === 'all') {
        for (const lang of Object.keys(TARGETS)) {
            await runLang(lang);
        }
    }
    else {
        await runLang(arg);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
