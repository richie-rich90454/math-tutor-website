export function exportChatAsMarkdown(
    messages: { role: string; content: string; timestamp: string }[],
    title: string,
): string {
    let md = `# ${title}\n\n`;
    md += `Exported on ${new Date().toLocaleString()}\n\n---\n\n`;

    for (const msg of messages) {
        const role = msg.role === "user" ? "**You**" : "**AI Math Tutor**";
        const time = new Date(msg.timestamp).toLocaleString();
        md += `### ${role} — ${time}\n\n${msg.content}\n\n---\n\n`;
    }

    return md;
}

export function exportChatAsText(
    messages: { role: string; content: string; timestamp: string }[],
    title: string,
): string {
    let text = `${title}\n`;
    text += `Exported on ${new Date().toLocaleString()}\n`;
    text += `${"=".repeat(50)}\n\n`;

    for (const msg of messages) {
        const role = msg.role === "user" ? "You" : "AI Math Tutor";
        const time = new Date(msg.timestamp).toLocaleString();
        text += `[${role}] — ${time}\n${msg.content}\n${"-".repeat(40)}\n\n`;
    }

    return text;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
