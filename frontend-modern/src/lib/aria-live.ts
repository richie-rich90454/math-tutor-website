export function announcePolite(message: string) {
    const el = document.getElementById("aria-live-polite");
    if (el) {
        el.textContent = "";
        requestAnimationFrame(() => {
            el.textContent = message;
        });
    }
}
