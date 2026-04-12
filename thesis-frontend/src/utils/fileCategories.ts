import type { FileMetadata } from '../types';
export type FileCategoryFilter = 'all' | 'images' | 'documents' | 'code' | 'media' | 'archives' | 'other';
export type NonAllCategory = Exclude<FileCategoryFilter, 'all'>;
const IMG_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic', 'avif']);
const DOC_EXT = new Set([
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'txt',
    'rtf',
    'odt',
    'ods',
    'odp',
    'csv',
]);
const CODE_EXT = new Set([
    'js',
    'mjs',
    'cjs',
    'ts',
    'tsx',
    'jsx',
    'java',
    'kt',
    'kts',
    'py',
    'rb',
    'go',
    'rs',
    'c',
    'cc',
    'cpp',
    'h',
    'hpp',
    'cs',
    'php',
    'swift',
    'sql',
    'html',
    'htm',
    'css',
    'scss',
    'sass',
    'less',
    'json',
    'xml',
    'yml',
    'yaml',
    'toml',
    'ini',
    'sh',
    'bash',
    'zsh',
    'ps1',
    'bat',
    'cmd',
    'md',
    'mdx',
    'vue',
    'svelte',
    'gradle',
    'properties',
]);
const MEDIA_EXT = new Set([
    'mp3',
    'wav',
    'ogg',
    'oga',
    'flac',
    'aac',
    'm4a',
    'opus',
    'wma',
    'mp4',
    'webm',
    'mov',
    'avi',
    'mkv',
    'wmv',
    'flv',
]);
const ARCH_EXT = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tgz', 'zst']);
function extOf(file: FileMetadata): string {
    const t = file.fileType?.toLowerCase().trim() || '';
    if (t)
        return t.replace(/^\./, '');
    const name = file.originalName || '';
    const i = name.lastIndexOf('.');
    return i === -1 ? '' : name.slice(i + 1).toLowerCase();
}
export function getFileCategory(file: FileMetadata): Exclude<FileCategoryFilter, 'all'> {
    const ext = extOf(file);
    const mime = (file.mimeType || '').toLowerCase();
    if (mime.startsWith('image/') || IMG_EXT.has(ext))
        return 'images';
    if (mime.startsWith('audio/') || mime.startsWith('video/'))
        return 'media';
    if (MEDIA_EXT.has(ext))
        return 'media';
    if (ARCH_EXT.has(ext) || mime.includes('zip') || mime.includes('compressed'))
        return 'archives';
    if (CODE_EXT.has(ext) || mime.includes('javascript') || mime.includes('json'))
        return 'code';
    if (DOC_EXT.has(ext) ||
        mime.includes('pdf') ||
        mime.includes('word') ||
        mime.includes('excel') ||
        mime.includes('spreadsheet') ||
        mime.includes('powerpoint') ||
        mime === 'text/plain') {
        return 'documents';
    }
    return 'other';
}
export function fileMatchesCategory(file: FileMetadata, filter: FileCategoryFilter): boolean {
    if (filter === 'all')
        return true;
    return getFileCategory(file) === filter;
}
export function fileMatchesSearch(file: FileMetadata, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q)
        return true;
    const name = (file.originalName || '').toLowerCase();
    const uploader = (file.uploader?.username || '').toLowerCase();
    return name.includes(q) || uploader.includes(q);
}
export function fileMatchesCategorySet(file: FileMetadata, selected: Set<NonAllCategory>): boolean {
    if (selected.size === 0)
        return true;
    return selected.has(getFileCategory(file));
}
export function fileMatchesUploaderSet(file: FileMetadata, uploaderIds: Set<string>): boolean {
    if (uploaderIds.size === 0)
        return true;
    const uid = file.uploader?.id;
    if (uid === undefined || uid === null || uid === '')
        return false;
    return uploaderIds.has(String(uid));
}
export function filterGroupFiles(files: FileMetadata[], categorySet: Set<NonAllCategory>, uploaderIds: Set<string>, search: string): FileMetadata[] {
    return files.filter((f) => fileMatchesCategorySet(f, categorySet) &&
        fileMatchesUploaderSet(f, uploaderIds) &&
        fileMatchesSearch(f, search));
}
