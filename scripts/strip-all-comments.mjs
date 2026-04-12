import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
const ts = require(path.join(ROOT, 'thesis-frontend/node_modules/typescript'));
const SKIP_DIRS = new Set([
    'node_modules',
    'dist',
    'target',
    '.git',
    'uploads',
    'logs',
    '.idea',
]);
const EXT_TS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
function walk(dir, out = []) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    }
    catch {
        return out;
    }
    for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (SKIP_DIRS.has(e.name))
                continue;
            walk(p, out);
        }
        else {
            out.push(p);
        }
    }
    return out;
}
function stripJavaLikeComments(code) {
    let i = 0;
    const n = code.length;
    let out = '';
    let state = 'code';
    while (i < n) {
        const c = code[i];
        const next = i + 1 < n ? code[i + 1] : '';
        if (state === 'code') {
            if (c === '/' && next === '/') {
                i += 2;
                state = 'line';
                continue;
            }
            if (c === '/' && next === '*') {
                i += 2;
                state = 'block';
                continue;
            }
            if (c === '"') {
                out += c;
                i++;
                state = 'str_d';
                continue;
            }
            if (c === "'") {
                out += c;
                i++;
                state = 'str_c';
                continue;
            }
            out += c;
            i++;
            continue;
        }
        if (state === 'line') {
            if (c === '\r') {
                i++;
                continue;
            }
            if (c === '\n') {
                out += c;
                i++;
                state = 'code';
                continue;
            }
            i++;
            continue;
        }
        if (state === 'block') {
            if (c === '*' && next === '/') {
                i += 2;
                state = 'code';
                continue;
            }
            i++;
            continue;
        }
        if (state === 'str_d') {
            out += c;
            if (c === '\\' && i + 1 < n) {
                out += code[i + 1];
                i += 2;
                continue;
            }
            if (c === '"') {
                i++;
                state = 'code';
                continue;
            }
            i++;
            continue;
        }
        if (state === 'str_c') {
            out += c;
            if (c === '\\' && i + 1 < n) {
                out += code[i + 1];
                i += 2;
                continue;
            }
            if (c === "'") {
                i++;
                state = 'code';
                continue;
            }
            i++;
            continue;
        }
    }
    return out;
}
function stripTsJs(filePath, content) {
    const ext = path.extname(filePath);
    let kind = ts.ScriptKind.TS;
    if (ext === '.tsx')
        kind = ts.ScriptKind.TSX;
    else if (ext === '.jsx')
        kind = ts.ScriptKind.JSX;
    else if (ext === '.js' || ext === '.mjs' || ext === '.cjs')
        kind = ts.ScriptKind.JS;
    const sf = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, kind);
    const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
        removeComments: true,
    });
    return printer.printFile(sf);
}
function stripBlockCommentsCssLike(code) {
    let i = 0;
    const n = code.length;
    let out = '';
    let state = 'code';
    while (i < n) {
        const c = code[i];
        const next = i + 1 < n ? code[i + 1] : '';
        if (state === 'code') {
            if (c === '/' && next === '*') {
                i += 2;
                state = 'block';
                continue;
            }
            if (c === '"') {
                out += c;
                i++;
                state = 'str_d';
                continue;
            }
            if (c === "'") {
                out += c;
                i++;
                state = 'str_s';
                continue;
            }
            out += c;
            i++;
            continue;
        }
        if (state === 'block') {
            if (c === '*' && next === '/') {
                i += 2;
                if (out.length && out[out.length - 1] !== '\n' && out[out.length - 1] !== ' ') {
                    out += ' ';
                }
                state = 'code';
                continue;
            }
            i++;
            continue;
        }
        if (state === 'str_d') {
            out += c;
            if (c === '\\' && i + 1 < n) {
                out += code[i + 1];
                i += 2;
                continue;
            }
            if (c === '"') {
                i++;
                state = 'code';
                continue;
            }
            i++;
            continue;
        }
        if (state === 'str_s') {
            out += c;
            if (c === '\\' && i + 1 < n) {
                out += code[i + 1];
                i += 2;
                continue;
            }
            if (c === "'") {
                i++;
                state = 'code';
                continue;
            }
            i++;
            continue;
        }
    }
    return out;
}
function stripHtmlComments(code) {
    return code.replace(/<!--[\s\S]*?-->/g, '');
}
function stripPropertiesLines(code) {
    return code
        .split(/\r?\n/)
        .filter((line) => {
        const t = line.trim();
        if (t.length === 0)
            return true;
        if (t.startsWith('#') || t.startsWith('!'))
            return false;
        return true;
    })
        .join('\n');
}
function stripYamlLineComment(line) {
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"' && !inSingle) {
            let bs = 0;
            for (let j = i - 1; j >= 0 && line[j] === '\\'; j--)
                bs++;
            if (bs % 2 === 0)
                inDouble = !inDouble;
        }
        else if (c === "'" && !inDouble) {
            inSingle = !inSingle;
        }
        else if (c === '#' && !inSingle && !inDouble) {
            return line.slice(0, i).replace(/\s+$/, '');
        }
    }
    return line;
}
function stripYamlDockerfileShell(code, mode) {
    const lines = code.split(/\r?\n/);
    const out = [];
    for (let line of lines) {
        if (mode === 'dockerfile' || mode === 'shell') {
            const t = line.trim();
            if (t.startsWith('#'))
                continue;
            out.push(line);
            continue;
        }
        if (mode === 'yaml') {
            const t = line.trim();
            if (t.startsWith('#'))
                continue;
            if (t === '') {
                out.push(line);
                continue;
            }
            out.push(stripYamlLineComment(line));
        }
    }
    return out.join('\n');
}
function processFile(filePath) {
    const rel = path.relative(ROOT, filePath);
    if (rel.includes(`${path.sep}node_modules${path.sep}`))
        return false;
    const ext = path.extname(filePath);
    const base = path.basename(filePath);
    let content = fs.readFileSync(filePath, 'utf8');
    let next = content;
    if (EXT_TS.has(ext)) {
        next = stripTsJs(filePath, content);
    }
    else if (ext === '.java') {
        next = stripJavaLikeComments(content);
    }
    else if (ext === '.css') {
        next = stripBlockCommentsCssLike(content);
    }
    else if (ext === '.properties') {
        next = stripPropertiesLines(content);
    }
    else if (ext === '.yml' || ext === '.yaml') {
        next = stripYamlDockerfileShell(content, 'yaml');
    }
    else if (base === 'Dockerfile' || base.endsWith('.dockerfile')) {
        next = stripYamlDockerfileShell(content, 'dockerfile');
    }
    else if (ext === '.html' || ext === '.xml') {
        next = stripHtmlComments(content);
    }
    else if (ext === '.sh') {
        next = stripYamlDockerfileShell(content, 'shell');
    }
    else {
        return false;
    }
    next = next.replace(/\n{3,}/g, '\n\n');
    if (next !== content) {
        fs.writeFileSync(filePath, next, 'utf8');
        return true;
    }
    return false;
}
const all = walk(ROOT);
let n = 0;
for (const f of all) {
    const ext = path.extname(f);
    const base = path.basename(f);
    if (!EXT_TS.has(ext) &&
        ext !== '.java' &&
        ext !== '.css' &&
        ext !== '.properties' &&
        ext !== '.yml' &&
        ext !== '.yaml' &&
        ext !== '.html' &&
        ext !== '.xml' &&
        ext !== '.sh' &&
        base !== 'Dockerfile' &&
        !base.endsWith('.dockerfile')) {
        continue;
    }
    if (processFile(f)) {
        console.log('stripped:', path.relative(ROOT, f));
        n++;
    }
}
console.log('Done. Files modified:', n);
