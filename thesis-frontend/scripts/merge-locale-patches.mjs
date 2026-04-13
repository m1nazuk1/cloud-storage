/**
 * Merges en.base.json with each locales/*.json patch and writes locales/*.merged.json
 * (for review / diff). Runtime uses mergeLocale(EN, patch) in config.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = path.join(ROOT, 'src/i18n/locales/en.base.json');
const LANGS = ['es', 'be', 'ka', 'az', 'zh', 'ar'];

const base = JSON.parse(fs.readFileSync(BASE, 'utf8'));
for (const lang of LANGS) {
    const p = path.join(ROOT, `src/i18n/locales/${lang}.json`);
    let patch = {};
    if (fs.existsSync(p)) {
        patch = JSON.parse(fs.readFileSync(p, 'utf8'));
    }
    const merged = { ...base, ...patch };
    fs.writeFileSync(path.join(ROOT, `src/i18n/locales/${lang}.merged.json`), JSON.stringify(merged, null, 2), 'utf8');
    console.log(lang, Object.keys(merged).length, 'keys');
}
