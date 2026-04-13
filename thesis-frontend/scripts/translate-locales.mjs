/**
 * One-off: fill locale JSON from en.base.json via MyMemory (free tier).
 * Usage: node scripts/translate-locales.mjs <langCode>
 * langCode: es | be | ka | az | zh | ar
 * MyMemory langpair: https://www.mymemory.translated.net/doc/spec.php
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src/i18n/locales/en.base.json');
const LANG_MAP = {
    es: 'es',
    be: 'be',
    ka: 'ka',
    az: 'az',
    zh: 'zh-CN',
    ar: 'ar',
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function translateText(text, target) {
    const q = encodeURIComponent(text);
    const tl = LANG_MAP[target] || target;
    const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=en|${tl}`;
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const out = data?.responseData?.translatedText;
    if (!out || data.responseStatus === 429)
        throw new Error(data?.responseData?.translatedText || 'quota or error');
    return String(out);
}

async function main() {
    const target = process.argv[2];
    if (!target || !LANG_MAP[target]) {
        console.error('Usage: node scripts/translate-locales.mjs <es|be|ka|az|zh|ar>');
        process.exit(1);
    }
    const en = JSON.parse(fs.readFileSync(SRC, 'utf8'));
    const outPath = path.join(ROOT, `src/i18n/locales/${target}.json`);
    let existing = {};
    if (fs.existsSync(outPath)) {
        try {
            existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
        }
        catch {
            existing = {};
        }
    }
    const keys = Object.keys(en);
    let done = 0;
    for (const key of keys) {
        if (existing[key])
            continue;
        const text = en[key];
        try {
            existing[key] = await translateText(text, target);
            done++;
        }
        catch (e) {
            console.error(`Fail ${key}:`, e.message);
            existing[key] = text;
        }
        await delay(180);
        if (done % 25 === 0 && done > 0) {
            fs.writeFileSync(outPath, JSON.stringify(existing, null, 2), 'utf8');
            console.error(`checkpoint ${Object.keys(existing).length}/${keys.length}`);
        }
    }
    fs.writeFileSync(outPath, JSON.stringify(existing, null, 2), 'utf8');
    console.log('Wrote', outPath, 'keys:', Object.keys(existing).length);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
