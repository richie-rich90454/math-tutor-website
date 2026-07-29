import { useState } from "preact/hooks";
import { Home } from "./pages/Home";
import { Chat } from "./pages/Chat";

export function App() {
    const [hasMessages, setHasMessages] = useState(false);

    return (
        <div class="app-shell">
            <main class="app-main">
                <div class="content-area">
                    {hasMessages ? <Chat /> : <Home onStart={() => setHasMessages(true)} />}
                </div>
                <footer class="app-footer">
                    <p class="app-footer-text">MathTutor AI — built for everyone</p>
                </footer>
            </main>
        </div>
    );
}
