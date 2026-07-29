export function parseUTCTimestamp(ts: string): Date {
    if (!ts) return new Date();
    if (ts.endsWith("Z") || ts.includes("+")) return new Date(ts);
    return new Date(ts.replace(" ", "T") + "Z");
}
