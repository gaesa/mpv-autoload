export function lstrip(str: string, prefix: string): string {
    return str.startsWith(prefix) ? str.slice(prefix.length) : str;
}
