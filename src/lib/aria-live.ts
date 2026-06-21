export function announcePolite(message: string) {
    const el = document.getElementById("aria-live-polite");
    if (el) {
        el.textContent = "";
        // Trigger re-announce by clearing and setting
        requestAnimationFrame(() => {
            el.textContent = message;
        });
    }
}

export function announceAssertive(message: string) {
    const el = document.getElementById("aria-live-assertive");
    if (el) {
        el.textContent = "";
        requestAnimationFrame(() => {
            el.textContent = message;
        });
    }
}
