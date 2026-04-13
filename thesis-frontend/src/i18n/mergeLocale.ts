/** Deep-merge translation maps: patch overrides base for the same keys. */
export function mergeLocale(base: Record<string, string>, patch: Record<string, string>): Record<string, string> {
    return { ...base, ...patch };
}
